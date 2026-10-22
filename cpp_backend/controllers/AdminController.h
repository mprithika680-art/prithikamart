#pragma once

#include <drogon/HttpController.h>

namespace prithika_mart {

class AdminController : public drogon::HttpController<AdminController> {
public:
    METHOD_LIST_BEGIN
    // MAIN ADMIN LOGIC
    ADD_METHOD_TO(AdminController::getStats, "/api/admin/stats", drogon::Get);
    ADD_METHOD_TO(AdminController::getAllUsers, "/api/admin/users", drogon::Get);
    ADD_METHOD_TO(AdminController::deleteUser, "/api/admin/users/{id}", drogon::Delete);
    METHOD_LIST_END

    void getStats(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getAllUsers(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void deleteUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& id);
};

} // namespace prithika_mart
