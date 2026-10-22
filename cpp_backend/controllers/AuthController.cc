#include "AuthController.h"
#include "../services/OtpService.h"
#include "../services/EmailService.h"
#include "../services/AuthService.h"
#include <json/json.h>

namespace prithika_mart {

// MAIN REGISTRATION LOGIC
void AuthController::registerUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        (*resp->jsonObject())["error"] = "Invalid JSON payload.";
        callback(resp);
        return;
    }

    const auto& json = *jsonPtr;
    std::string fullName = json.get("fullName", "").asString();
    std::string email = json.get("email", "").asString();
    std::string password = json.get("password", "").asString();
    std::string confirmPassword = json.get("confirmPassword", "").asString();
    std::string role = json.get("role", "buyer").asString();

    if (fullName.empty() || email.empty() || password.empty() || confirmPassword.empty()) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        (*resp->jsonObject())["error"] = "All fields are required.";
        callback(resp);
        return;
    }

    if (password != confirmPassword) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        (*resp->jsonObject())["error"] = "Password and Confirm Password do not match.";
        callback(resp);
        return;
    }

    auto dbClient = drogon::app().getDbClient();
    if (!dbClient) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        (*resp->jsonObject())["error"] = "Database connection unavailable.";
        callback(resp);
        return;
    }

    try {
        // Check if user already exists
        auto existing = dbClient->execSqlSync("SELECT id, is_verified FROM users WHERE email = $1", email);
        std::string passwordHash = AuthService::getInstance().hashPassword(password);

        if (!existing.empty()) {
            if (existing[0]["is_verified"].as<bool>()) {
                auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
                resp->setStatusCode(drogon::k409Conflict);
                (*resp->jsonObject())["error"] = "An account with this email already exists.";
                callback(resp);
                return;
            } else {
                dbClient->execSqlSync(
                    "UPDATE users SET full_name = $1, password_hash = $2, role = $3 WHERE email = $4",
                    fullName, passwordHash, role, email
                );
            }
        } else {
            dbClient->execSqlSync(
                "INSERT INTO users (full_name, email, password_hash, role, is_verified) "
                "VALUES ($1, $2, $3, $4, FALSE)",
                fullName, email, passwordHash, role
            );
        }

        // MAIN OTP GENERATION LOGIC
        std::string otpCode = OtpService::getInstance().generateAndStoreOtp(email);

        // MAIN EMAIL SENDING LOGIC
        EmailService::getInstance().sendVerificationEmail(email, fullName, otpCode);

        // CRITICAL: NEVER return the OTP inside the API response
        Json::Value resJson;
        resJson["success"] = true;
        resJson["message"] = "Registration received. Real-time OTP sent to your registered email address.";
        resJson["email"] = email;
        resJson["expiresInSeconds"] = 300;

        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "Registration exception: " << e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        (*resp->jsonObject())["error"] = "Internal error during registration.";
        callback(resp);
    }
}

// MAIN OTP VERIFICATION LOGIC
void AuthController::verifyOtp(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        (*resp->jsonObject())["error"] = "Invalid JSON payload.";
        callback(resp);
        return;
    }

    const auto& json = *jsonPtr;
    std::string email = json.get("email", "").asString();
    std::string otp = json.get("otp", "").asString();

    std::string errorMessage;
    bool verified = OtpService::getInstance().verifyOtp(email, otp, errorMessage);

    if (!verified) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        (*resp->jsonObject())["error"] = errorMessage;
        callback(resp);
        return;
    }

    // Retrieve verified user to issue session token
    auto dbClient = drogon::app().getDbClient();
    auto result = dbClient->execSqlSync("SELECT id, full_name, email, role, is_verified, created_at FROM users WHERE email = $1", email);
    auto row = result[0];

    std::string userId = row["id"].as<std::string>();
    std::string sessionToken = AuthService::getInstance().generateSessionToken(userId);

    Json::Value resJson;
    resJson["success"] = true;
    resJson["message"] = "OTP successfully verified! Welcome to Prithika Mart.";
    resJson["token"] = sessionToken;
    resJson["user"]["id"] = userId;
    resJson["user"]["fullName"] = row["full_name"].as<std::string>();
    resJson["user"]["email"] = row["email"].as<std::string>();
    resJson["user"]["role"] = row["role"].as<std::string>();
    resJson["user"]["isVerified"] = true;

    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

void AuthController::resendOtp(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    std::string email = jsonPtr ? jsonPtr->get("email", "").asString() : "";
    if (email.empty()) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        (*resp->jsonObject())["error"] = "Email is required.";
        callback(resp);
        return;
    }

    std::string otpCode = OtpService::getInstance().generateAndStoreOtp(email);
    EmailService::getInstance().sendVerificationEmail(email, "Prithika Mart Shopper", otpCode);

    Json::Value resJson;
    resJson["success"] = true;
    resJson["message"] = "A fresh OTP has been sent to your registered email address.";
    resJson["expiresInSeconds"] = 300;

    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

// MAIN LOGIN LOGIC
void AuthController::login(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    std::string email = jsonPtr->get("email", "").asString();
    std::string password = jsonPtr->get("password", "").asString();

    std::string errorMessage;
    auto userOpt = AuthService::getInstance().loginUser(email, password, errorMessage);

    if (!userOpt) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k401Unauthorized);
        (*resp->jsonObject())["error"] = errorMessage;
        callback(resp);
        return;
    }

    auto user = *userOpt;
    std::string sessionToken = AuthService::getInstance().generateSessionToken(user.id);

    Json::Value resJson;
    resJson["success"] = true;
    resJson["message"] = "Login successful!";
    resJson["token"] = sessionToken;
    resJson["user"]["id"] = user.id;
    resJson["user"]["fullName"] = user.fullName;
    resJson["user"]["email"] = user.email;
    resJson["user"]["role"] = userRoleToString(user.role);
    resJson["user"]["isVerified"] = user.isVerified;

    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

void AuthController::getMe(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    // Return authenticated profile
    Json::Value resJson;
    resJson["authenticated"] = true;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

void AuthController::logout(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    Json::Value resJson;
    resJson["success"] = true;
    resJson["message"] = "Logged out successfully.";
    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

} // namespace prithika_mart
