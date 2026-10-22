#include "WishlistController.h"
#include <json/json.h>

namespace prithika_mart {

// MAIN WISHLIST LOGIC
// Connects to PostgreSQL wishlist table to persist user favorites across sessions
void WishlistController::getWishlist(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto dbClient = drogon::app().getDbClient();
    std::string userId = "usr-demo-default";

    try {
        auto result = dbClient->execSqlSync(
            "SELECT w.id, w.product_id, w.created_at, "
            "p.name, p.price, p.image_url, p.category_name, p.rating, p.review_count, p.stock "
            "FROM wishlist w "
            "JOIN products p ON w.product_id = p.id "
            "WHERE w.user_id = $1",
            userId
        );

        Json::Value resJson;
        Json::Value wishlistArray(Json::arrayValue);

        for (const auto& row : result) {
            Json::Value item;
            item["id"] = row["id"].as<std::string>();
            item["productId"] = row["product_id"].as<std::string>();
            item["addedAt"] = row["created_at"].as<std::string>();

            Json::Value prod;
            prod["id"] = row["product_id"].as<std::string>();
            prod["name"] = row["name"].as<std::string>();
            prod["price"] = row["price"].as<double>();
            prod["imageUrl"] = row["image_url"].as<std::string>();
            prod["category"] = row["category_name"].as<std::string>();
            prod["rating"] = row["rating"].as<double>();
            prod["reviewCount"] = row["review_count"].as<int>();
            prod["stock"] = row["stock"].as<int>();
            item["product"] = prod;

            wishlistArray.append(item);
        }

        resJson["wishlist"] = wishlistArray;
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "getWishlist exception: " << e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void WishlistController::addToWishlist(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    std::string productId = jsonPtr->get("productId", "").asString();
    std::string userId = "usr-demo-default";

    auto dbClient = drogon::app().getDbClient();
    try {
        dbClient->execSqlSync(
            "INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            userId, productId
        );

        Json::Value resJson;
        resJson["success"] = true;
        resJson["message"] = "Added to wishlist.";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "addToWishlist exception: " << e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void WishlistController::removeFromWishlist(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& productId) {
    std::string userId = "usr-demo-default";
    auto dbClient = drogon::app().getDbClient();
    dbClient->execSqlSync("DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2", userId, productId);

    Json::Value resJson;
    resJson["success"] = true;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

} // namespace prithika_mart
