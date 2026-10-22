#pragma once

#include <drogon/HttpController.h>

namespace prithika_mart {

class AuthController : public drogon::HttpController<AuthController> {
public:
    METHOD_LIST_BEGIN
    // MAIN REGISTRATION LOGIC
    ADD_METHOD_TO(AuthController::registerUser, "/api/auth/register", drogon::Post);
    // MAIN OTP VERIFICATION LOGIC
    ADD_METHOD_TO(AuthController::verifyOtp, "/api/auth/verify-otp", drogon::Post);
    ADD_METHOD_TO(AuthController::resendOtp, "/api/auth/resend-otp", drogon::Post);
    // MAIN LOGIN LOGIC
    ADD_METHOD_TO(AuthController::login, "/api/auth/login", drogon::Post);
    ADD_METHOD_TO(AuthController::getMe, "/api/auth/me", drogon::Get);
    ADD_METHOD_TO(AuthController::logout, "/api/auth/logout", drogon::Post);
    METHOD_LIST_END

    void registerUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void verifyOtp(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void resendOtp(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void login(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getMe(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void logout(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};

} // namespace prithika_mart
