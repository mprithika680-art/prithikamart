#pragma once

#include <drogon/HttpController.h>

namespace prithika_mart {

class ProductController : public drogon::HttpController<ProductController> {
public:
    METHOD_LIST_BEGIN
    // MAIN PRODUCT LOGIC
    ADD_METHOD_TO(ProductController::getAllProducts, "/api/products", drogon::Get);
    // MAIN SEARCH LOGIC
    ADD_METHOD_TO(ProductController::searchProducts, "/api/products/search", drogon::Get);
    ADD_METHOD_TO(ProductController::getProductById, "/api/products/{id}", drogon::Get);
    METHOD_LIST_END

    void getAllProducts(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void searchProducts(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getProductById(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& id);
};

} // namespace prithika_mart
