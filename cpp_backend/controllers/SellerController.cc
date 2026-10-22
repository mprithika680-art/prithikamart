#include "SellerController.h"
#include <json/json.h>

namespace prithika_mart {

// MAIN SELLER LOGIC
// Controls seller product inventory management, stock levels, and order fulfillment status
void SellerController::getSellerProducts(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    std::string sellerId = "usr-seller-01";
    auto dbClient = drogon::app().getDbClient();

    try {
        auto result = dbClient->execSqlSync(
            "SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC", sellerId
        );

        Json::Value resJson;
        Json::Value productsArray(Json::arrayValue);

        for (const auto& row : result) {
            Json::Value p;
            p["id"] = row["id"].as<std::string>();
            p["name"] = row["name"].as<std::string>();
            p["price"] = row["price"].as<double>();
            p["stock"] = row["stock"].as<int>();
            p["category"] = row["category_name"].as<std::string>();
            p["imageUrl"] = row["image_url"].as<std::string>();
            p["inStock"] = row["in_stock"].as<bool>();
            productsArray.append(p);
        }

        resJson["products"] = productsArray;
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void SellerController::addProduct(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    const auto& json = *jsonPtr;
    std::string name = json.get("name", "").asString();
    std::string desc = json.get("description", "").asString();
    double price = json.get("price", 0.0).asDouble();
    std::string category = json.get("category", "Electronics").asString();
    std::string categorySlug = "electronics";
    int stock = json.get("stock", 10).asInt();
    std::string imageUrl = json.get("imageUrl", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800").asString();
    std::string sellerId = "usr-seller-01";
    std::string sellerName = "Apex Retailers Official";

    auto dbClient = drogon::app().getDbClient();
    try {
        dbClient->execSqlSync(
            "INSERT INTO products (name, description, price, original_price, discount_percent, "
            "category_name, category_slug, seller_id, seller_name, stock, image_url, brand, in_stock) "
            "VALUES ($1, $2, $3, $4, 15, $5, $6, $7, $8, $9, $10, 'Prithika Seller Brand', TRUE)",
            name, desc, price, price * 1.2, category, categorySlug, sellerId, sellerName, stock, imageUrl
        );

        Json::Value resJson;
        resJson["success"] = true;
        resJson["message"] = "Product added successfully by seller.";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "Add product exception: " << e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void SellerController::updateProduct(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& id) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    const auto& json = *jsonPtr;
    auto dbClient = drogon::app().getDbClient();
    try {
        if (json.isMember("price")) {
            dbClient->execSqlSync("UPDATE products SET price = $1 WHERE id = $2", json["price"].asDouble(), id);
        }
        if (json.isMember("stock")) {
            int newStock = json["stock"].asInt();
            dbClient->execSqlSync("UPDATE products SET stock = $1, in_stock = ($1 > 0) WHERE id = $2", newStock, id);
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

void SellerController::deleteProduct(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& id) {
    auto dbClient = drogon::app().getDbClient();
    dbClient->execSqlSync("DELETE FROM products WHERE id = $1", id);

    Json::Value resJson;
    resJson["success"] = true;
    resJson["message"] = "Product deleted.";
    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

void SellerController::getSellerOrders(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    std::string sellerId = "usr-seller-01";
    auto dbClient = drogon::app().getDbClient();

    try {
        auto result = dbClient->execSqlSync(
            "SELECT DISTINCT o.* FROM orders o "
            "JOIN order_items oi ON o.id = oi.order_id "
            "WHERE oi.seller_id = $1 ORDER BY o.created_at DESC",
            sellerId
        );

        Json::Value resJson;
        Json::Value ordersArray(Json::arrayValue);
        for (const auto& row : result) {
            Json::Value ord;
            ord["id"] = row["id"].as<std::string>();
            ord["customerName"] = row["customer_name"].as<std::string>();
            ord["totalAmount"] = row["total_amount"].as<double>();
            ord["status"] = row["status"].as<std::string>();
            ordersArray.append(ord);
        }

        resJson["orders"] = ordersArray;
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void SellerController::updateOrderStatus(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& id) {
    auto jsonPtr = req->getJsonObject();
    std::string status = jsonPtr ? jsonPtr->get("status", "Confirmed").asString() : "Confirmed";

    auto dbClient = drogon::app().getDbClient();
    dbClient->execSqlSync("UPDATE orders SET status = $1 WHERE id = $2", status, id);

    Json::Value resJson;
    resJson["success"] = true;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

} // namespace prithika_mart
