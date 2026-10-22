#pragma once

#include <drogon/HttpController.h>

namespace prithika_mart {

class CartController : public drogon::HttpController<CartController> {
public:
    METHOD_LIST_BEGIN
    // MAIN CART LOGIC
    ADD_METHOD_TO(CartController::getCart, "/api/cart", drogon::Get);
    ADD_METHOD_TO(CartController::addToCart, "/api/cart", drogon::Post);
    ADD_METHOD_TO(CartController::updateQuantity, "/api/cart/{productId}", drogon::Put);
    ADD_METHOD_TO(CartController::removeFromCart, "/api/cart/{productId}", drogon::Delete);
    ADD_METHOD_TO(CartController::clearCart, "/api/cart", drogon::Delete);
    METHOD_LIST_END

    void getCart(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void addToCart(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void updateQuantity(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& productId);
    void removeFromCart(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& productId);
    void clearCart(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};

} // namespace prithika_mart
