#include "OrderController.h"
#include <json/json.h>
#include <random>

namespace prithika_mart {

// MAIN CHECKOUT LOGIC
// Creates order in PostgreSQL, generates unique order ID, records order items, updates product stock, and clears cart
void OrderController::checkout(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    const auto& json = *jsonPtr;
    auto shipping = json["shippingAddress"];
    std::string fullName = shipping.get("fullName", "").asString();
    std::string street = shipping.get("street", "").asString();
    std::string city = shipping.get("city", "").asString();
    std::string state = shipping.get("state", "").asString();
    std::string zip = shipping.get("zipCode", "").asString();
    std::string phone = shipping.get("phone", "").asString();
    std::string paymentMethod = json.get("paymentMethod", "Cash on Delivery").asString();
    std::string userId = "usr-demo-default";

    auto dbClient = drogon::app().getDbClient();
    if (!dbClient) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
        return;
    }

    try {
        // Fetch cart items
        auto cartRows = dbClient->execSqlSync(
            "SELECT c.product_id, c.quantity, p.name, p.price, p.image_url, p.seller_id, p.seller_name, p.stock "
            "FROM cart_items c "
            "JOIN products p ON c.product_id = p.id "
            "WHERE c.user_id = $1",
            userId
        );

        if (cartRows.empty()) {
            auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
            resp->setStatusCode(drogon::k400BadRequest);
            (*resp->jsonObject())["error"] = "Shopping cart is empty.";
            callback(resp);
            return;
        }

        // Generate Order ID
        int randNum = 100000 + (std::rand() % 900000);
        std::string orderId = "PM-ORD-" + std::to_string(randNum);

        double subtotal = 0.0;
        for (const auto& row : cartRows) {
            subtotal += row["price"].as<double>() * row["quantity"].as<int>();
        }
        double shippingFee = subtotal > 50.0 ? 0.0 : 5.99;
        double tax = subtotal * 0.08;
        double total = subtotal + shippingFee + tax;

        // Insert into orders table
        dbClient->execSqlSync(
            "INSERT INTO orders (id, user_id, customer_name, customer_email, "
            "shipping_street, shipping_city, shipping_state, shipping_zip, shipping_phone, "
            "subtotal, shipping_fee, tax, total_amount, status, payment_method) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Confirmed', $14)",
            orderId, userId, fullName, "customer@prithikamart.com",
            street, city, state, zip, phone,
            subtotal, shippingFee, tax, total, paymentMethod
        );

        // Insert order items and deduct stock
        for (const auto& row : cartRows) {
            std::string prodId = row["product_id"].as<std::string>();
            int qty = row["quantity"].as<int>();
            double price = row["price"].as<double>();

            dbClient->execSqlSync(
                "INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, seller_id, seller_name) "
                "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                orderId, prodId, row["name"].as<std::string>(), row["image_url"].as<std::string>(),
                price, qty, row["seller_id"].as<std::string>(), row["seller_name"].as<std::string>()
            );

            // Stock update
            dbClient->execSqlSync(
                "UPDATE products SET stock = GREATEST(0, stock - $1), "
                "in_stock = (stock - $1 > 0) WHERE id = $2",
                qty, prodId
            );
        }

        // Clear user cart
        dbClient->execSqlSync("DELETE FROM cart_items WHERE user_id = $1", userId);

        Json::Value resJson;
        resJson["success"] = true;
        resJson["orderId"] = orderId;
        resJson["message"] = "Order confirmed successfully.";
        resJson["totalAmount"] = total;

        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "Checkout error: " << e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

// MAIN ORDER LOGIC
void OrderController::getUserOrders(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    std::string userId = "usr-demo-default";
    auto dbClient = drogon::app().getDbClient();

    try {
        auto orderRows = dbClient->execSqlSync(
            "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC", userId
        );

        Json::Value resJson;
        Json::Value ordersArray(Json::arrayValue);

        for (const auto& oRow : orderRows) {
            Json::Value ord;
            std::string oId = oRow["id"].as<std::string>();
            ord["id"] = oId;
            ord["totalAmount"] = oRow["total_amount"].as<double>();
            ord["status"] = oRow["status"].as<std::string>();
            ord["createdAt"] = oRow["created_at"].as<std::string>();

            // Get items
            auto itemRows = dbClient->execSqlSync("SELECT * FROM order_items WHERE order_id = $1", oId);
            Json::Value itemsArray(Json::arrayValue);
            for (const auto& iRow : itemRows) {
                Json::Value item;
                item["productName"] = iRow["product_name"].as<std::string>();
                item["price"] = iRow["price"].as<double>();
                item["quantity"] = iRow["quantity"].as<int>();
                item["productImage"] = iRow["product_image"].as<std::string>();
                itemsArray.append(item);
            }
            ord["items"] = itemsArray;
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

} // namespace prithika_mart
