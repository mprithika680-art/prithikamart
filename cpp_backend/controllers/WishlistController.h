#pragma once

#include <drogon/HttpController.h>

namespace prithika_mart {

class WishlistController : public drogon::HttpController<WishlistController> {
public:
    METHOD_LIST_BEGIN
    // MAIN WISHLIST LOGIC
    ADD_METHOD_TO(WishlistController::getWishlist, "/api/wishlist", drogon::Get);
    ADD_METHOD_TO(WishlistController::addToWishlist, "/api/wishlist", drogon::Post);
    ADD_METHOD_TO(WishlistController::removeFromWishlist, "/api/wishlist/{productId}", drogon::Delete);
    METHOD_LIST_END

    void getWishlist(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void addToWishlist(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void removeFromWishlist(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& productId);
};

} // namespace prithika_mart
