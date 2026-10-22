#pragma once

#include <drogon/HttpController.h>

namespace prithika_mart {

class SellerController : public drogon::HttpController<SellerController> {
public:
    METHOD_LIST_BEGIN
    // MAIN SELLER LOGIC
    ADD_METHOD_TO(SellerController::getSellerProducts, "/api/seller/products", drogon::Get);
    ADD_METHOD_TO(SellerController::addProduct, "/api/seller/products", drogon::Post);
    ADD_METHOD_TO(SellerController::updateProduct, "/api/seller/products/{id}", drogon::Put);
    ADD_METHOD_TO(SellerController::deleteProduct, "/api/seller/products/{id}", drogon::Delete);
    ADD_METHOD_TO(SellerController::getSellerOrders, "/api/seller/orders", drogon::Get);
    ADD_METHOD_TO(SellerController::updateOrderStatus, "/api/seller/orders/{id}/status", drogon::Patch);
    METHOD_LIST_END

    void getSellerProducts(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void addProduct(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void updateProduct(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& id);
    void deleteProduct(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& id);
    void getSellerOrders(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void updateOrderStatus(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& id);
};

} // namespace prithika_mart
