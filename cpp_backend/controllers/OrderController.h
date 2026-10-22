#pragma once

#include <drogon/HttpController.h>

namespace prithika_mart {

class OrderController : public drogon::HttpController<OrderController> {
public:
    METHOD_LIST_BEGIN
    // MAIN CHECKOUT LOGIC
    ADD_METHOD_TO(OrderController::checkout, "/api/checkout", drogon::Post);
    // MAIN ORDER LOGIC
    ADD_METHOD_TO(OrderController::getUserOrders, "/api/orders", drogon::Get);
    METHOD_LIST_END

    void checkout(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getUserOrders(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};

} // namespace prithika_mart
