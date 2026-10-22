#include "AdminController.h"
#include <json/json.h>

namespace prithika_mart {

// MAIN ADMIN LOGIC
// Gathers platform-wide metrics and manages marketplace user accounts
void AdminController::getStats(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto dbClient = drogon::app().getDbClient();
    try {
        auto uRes = dbClient->execSqlSync("SELECT COUNT(*) as cnt FROM users");
        auto pRes = dbClient->execSqlSync("SELECT COUNT(*) as cnt FROM products");
        auto oRes = dbClient->execSqlSync("SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as rev FROM orders");

        Json::Value resJson;
        resJson["stats"]["totalUsers"] = uRes[0]["cnt"].as<int>();
        resJson["stats"]["totalProducts"] = pRes[0]["cnt"].as<int>();
        resJson["stats"]["totalOrders"] = oRes[0]["cnt"].as<int>();
        resJson["stats"]["totalRevenue"] = oRes[0]["rev"].as<double>();

        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void AdminController::getAllUsers(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto dbClient = drogon::app().getDbClient();
    try {
        auto result = dbClient->execSqlSync("SELECT id, full_name, email, role, is_verified, created_at FROM users ORDER BY created_at DESC");
        Json::Value resJson;
        Json::Value usersArray(Json::arrayValue);

        for (const auto& row : result) {
            Json::Value u;
            u["id"] = row["id"].as<std::string>();
            u["fullName"] = row["full_name"].as<std::string>();
            u["email"] = row["email"].as<std::string>();
            u["role"] = row["role"].as<std::string>();
            u["isVerified"] = row["is_verified"].as<bool>();
            u["createdAt"] = row["created_at"].as<std::string>();
            usersArray.append(u);
        }

        resJson["users"] = usersArray;
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void AdminController::deleteUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& id) {
    auto dbClient = drogon::app().getDbClient();
    dbClient->execSqlSync("DELETE FROM users WHERE id = $1", id);

    Json::Value resJson;
    resJson["success"] = true;
    resJson["message"] = "User account removed by administrator.";
    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

} // namespace prithika_mart
