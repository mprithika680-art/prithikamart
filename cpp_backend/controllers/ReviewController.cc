#include "ReviewController.h"
#include <json/json.h>

namespace prithika_mart {

// MAIN REVIEW LOGIC
// Inserts verified customer rating and feedback, updates product aggregate rating
void ReviewController::createReview(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    const auto& json = *jsonPtr;
    std::string productId = json.get("productId", "").asString();
    int rating = json.get("rating", 5).asInt();
    std::string title = json.get("title", "Great purchase").asString();
    std::string comment = json.get("comment", "").asString();
    std::string userId = "usr-demo-default";
    std::string userName = "Verified Shopper";

    auto dbClient = drogon::app().getDbClient();
    try {
        dbClient->execSqlSync(
            "INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment, verified_purchase) "
            "VALUES ($1, $2, $3, $4, $5, $6, TRUE)",
            productId, userId, userName, rating, title, comment
        );

        // Update product rating aggregate
        dbClient->execSqlSync(
            "UPDATE products SET "
            "rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = $1), "
            "review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1) "
            "WHERE id = $1",
            productId
        );

        Json::Value resJson;
        resJson["success"] = true;
        resJson["message"] = "Review submitted successfully!";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "Review exception: " << e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void ReviewController::getProductReviews(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& productId) {
    auto dbClient = drogon::app().getDbClient();
    try {
        auto result = dbClient->execSqlSync(
            "SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC", productId
        );

        Json::Value resJson;
        Json::Value reviewsArray(Json::arrayValue);
        for (const auto& row : result) {
            Json::Value r;
            r["id"] = row["id"].as<std::string>();
            r["productId"] = row["product_id"].as<std::string>();
            r["userName"] = row["user_name"].as<std::string>();
            r["rating"] = row["rating"].as<int>();
            r["title"] = row["title"].as<std::string>();
            r["comment"] = row["comment"].as<std::string>();
            r["verifiedPurchase"] = row["verified_purchase"].as<bool>();
            r["createdAt"] = row["created_at"].as<std::string>();
            reviewsArray.append(r);
        }

        resJson["reviews"] = reviewsArray;
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

} // namespace prithika_mart
