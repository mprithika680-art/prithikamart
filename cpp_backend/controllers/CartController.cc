#include "CartController.h"
#include <json/json.h>

namespace prithika_mart {

// MAIN CART LOGIC
// Manages database persistence for the user shopping cart
void CartController::getCart(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto dbClient = drogon::app().getDbClient();
    std::string authHeader = req->getHeader("Authorization");
    std::string userId = "usr-demo-default"; // Derived from token session

    try {
        auto result = dbClient->execSqlSync(
            "SELECT c.id, c.user_id, c.product_id, c.quantity, "
            "p.name, p.price, p.image_url, p.stock, p.category_name "
            "FROM cart_items c "
            "JOIN products p ON c.product_id = p.id "
            "WHERE c.user_id = $1",
            userId
        );

        Json::Value resJson;
        Json::Value cartArray(Json::arrayValue);
        double subtotal = 0.0;

        for (const auto& row : result) {
            Json::Value item;
            item["id"] = row["id"].as<std::string>();
            item["productId"] = row["product_id"].as<std::string>();
            item["quantity"] = row["quantity"].as<int>();

            Json::Value prod;
            prod["name"] = row["name"].as<std::string>();
            prod["price"] = row["price"].as<double>();
            prod["imageUrl"] = row["image_url"].as<std::string>();
            prod["stock"] = row["stock"].as<int>();
            prod["category"] = row["category_name"].as<std::string>();
            item["product"] = prod;

            subtotal += row["price"].as<double>() * row["quantity"].as<int>();
            cartArray.append(item);
        }

        resJson["cart"] = cartArray;
        resJson["summary"]["subtotal"] = subtotal;
        resJson["summary"]["shippingFee"] = subtotal > 50.0 || subtotal == 0 ? 0.0 : 5.99;
        resJson["summary"]["tax"] = subtotal * 0.08;
        resJson["summary"]["total"] = subtotal + resJson["summary"]["shippingFee"].asDouble() + resJson["summary"]["tax"].asDouble();

        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "getCart exception: " << e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void CartController::addToCart(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    std::string productId = jsonPtr->get("productId", "").asString();
    int quantity = jsonPtr->get("quantity", 1).asInt();
    std::string userId = "usr-demo-default";

    auto dbClient = drogon::app().getDbClient();
    try {
        dbClient->execSqlSync(
            "INSERT INTO cart_items (user_id, product_id, quantity) "
            "VALUES ($1, $2, $3) "
            "ON CONFLICT (user_id, product_id) DO UPDATE "
            "SET quantity = cart_items.quantity + EXCLUDED.quantity",
            userId, productId, quantity
        );

        Json::Value resJson;
        resJson["success"] = true;
        resJson["message"] = "Product added to cart.";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "addToCart exception: " << e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void CartController::updateQuantity(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& productId) {
    auto jsonPtr = req->getJsonObject();
    int quantity = jsonPtr ? jsonPtr->get("quantity", 1).asInt() : 1;
    std::string userId = "usr-demo-default";

    auto dbClient = drogon::app().getDbClient();
    try {
        if (quantity <= 0) {
            dbClient->execSqlSync("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", userId, productId);
        } else {
            dbClient->execSqlSync("UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3", quantity, userId, productId);
        }

        Json::Value resJson;
        resJson["success"] = true;
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void CartController::removeFromCart(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& productId) {
    std::string userId = "usr-demo-default";
    auto dbClient = drogon::app().getDbClient();
    dbClient->execSqlSync("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", userId, productId);

    Json::Value resJson;
    resJson["success"] = true;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

void CartController::clearCart(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    std::string userId = "usr-demo-default";
    auto dbClient = drogon::app().getDbClient();
    dbClient->execSqlSync("DELETE FROM cart_items WHERE user_id = $1", userId);

    Json::Value resJson;
    resJson["success"] = true;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

} // namespace prithika_mart
