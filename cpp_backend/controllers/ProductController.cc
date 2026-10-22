#include "ProductController.h"
#include <json/json.h>

namespace prithika_mart {

// MAIN PRODUCT LOGIC
// Queries all available products from PostgreSQL database
void ProductController::getAllProducts(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto dbClient = drogon::app().getDbClient();
    if (!dbClient) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
        return;
    }

    try {
        auto result = dbClient->execSqlSync(
            "SELECT id, name, description, price, original_price, discount_percent, "
            "category_name, category_slug, seller_id, seller_name, seller_rating, "
            "rating, review_count, stock, image_url, brand, in_stock, created_at "
            "FROM products ORDER BY created_at DESC"
        );

        Json::Value resJson;
        Json::Value productsArray(Json::arrayValue);

        for (const auto& row : result) {
            Json::Value p;
            p["id"] = row["id"].as<std::string>();
            p["name"] = row["name"].as<std::string>();
            p["description"] = row["description"].as<std::string>();
            p["price"] = row["price"].as<double>();
            p["originalPrice"] = row["original_price"].as<double>();
            p["discountPercent"] = row["discount_percent"].as<int>();
            p["category"] = row["category_name"].as<std::string>();
            p["categorySlug"] = row["category_slug"].as<std::string>();
            p["sellerId"] = row["seller_id"].as<std::string>();
            p["sellerName"] = row["seller_name"].as<std::string>();
            p["sellerRating"] = row["seller_rating"].as<double>();
            p["rating"] = row["rating"].as<double>();
            p["reviewCount"] = row["review_count"].as<int>();
            p["stock"] = row["stock"].as<int>();
            p["imageUrl"] = row["image_url"].as<std::string>();
            p["brand"] = row["brand"].as<std::string>();
            p["inStock"] = row["in_stock"].as<bool>();
            p["createdAt"] = row["created_at"].as<std::string>();
            productsArray.append(p);
        }

        resJson["products"] = productsArray;
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "PostgreSQL getAllProducts exception: " << e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

// MAIN SEARCH LOGIC
// Dynamic PostgreSQL parameterized query filtering by keyword, category, price range, and sorting
void ProductController::searchProducts(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto q = req->getParameter("q");
    auto category = req->getParameter("category");
    auto minPrice = req->getParameter("minPrice");
    auto maxPrice = req->getParameter("maxPrice");
    auto inStock = req->getParameter("inStock");
    auto sortBy = req->getParameter("sortBy");

    auto dbClient = drogon::app().getDbClient();
    if (!dbClient) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
        return;
    }

    try {
        std::string sql = "SELECT * FROM products WHERE 1=1 ";
        std::vector<std::string> params;

        if (!q.empty()) {
            sql += "AND (LOWER(name) LIKE LOWER('%" + q + "%') OR LOWER(description) LIKE LOWER('%" + q + "%') OR LOWER(brand) LIKE LOWER('%" + q + "%')) ";
        }

        if (!category.empty() && category != "all") {
            sql += "AND (category_slug = '" + category + "' OR LOWER(category_name) = LOWER('" + category + "')) ";
        }

        if (!minPrice.empty()) {
            sql += "AND price >= " + minPrice + " ";
        }

        if (!maxPrice.empty()) {
            sql += "AND price <= " + maxPrice + " ";
        }

        if (inStock == "true") {
            sql += "AND in_stock = TRUE AND stock > 0 ";
        }

        if (sortBy == "price-asc") {
            sql += "ORDER BY price ASC";
        } else if (sortBy == "price-desc") {
            sql += "ORDER BY price DESC";
        } else if (sortBy == "rating") {
            sql += "ORDER BY rating DESC";
        } else {
            sql += "ORDER BY created_at DESC";
        }

        auto result = dbClient->execSqlSync(sql);
        Json::Value resJson;
        Json::Value productsArray(Json::arrayValue);

        for (const auto& row : result) {
            Json::Value p;
            p["id"] = row["id"].as<std::string>();
            p["name"] = row["name"].as<std::string>();
            p["description"] = row["description"].as<std::string>();
            p["price"] = row["price"].as<double>();
            p["originalPrice"] = row["original_price"].as<double>();
            p["discountPercent"] = row["discount_percent"].as<int>();
            p["category"] = row["category_name"].as<std::string>();
            p["categorySlug"] = row["category_slug"].as<std::string>();
            p["sellerId"] = row["seller_id"].as<std::string>();
            p["sellerName"] = row["seller_name"].as<std::string>();
            p["sellerRating"] = row["seller_rating"].as<double>();
            p["rating"] = row["rating"].as<double>();
            p["reviewCount"] = row["review_count"].as<int>();
            p["stock"] = row["stock"].as<int>();
            p["imageUrl"] = row["image_url"].as<std::string>();
            p["brand"] = row["brand"].as<std::string>();
            p["inStock"] = row["in_stock"].as<bool>();
            productsArray.append(p);
        }

        resJson["products"] = productsArray;
        resJson["count"] = static_cast<int>(productsArray.size());
        auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
        callback(resp);
    } catch (const std::exception& e) {
        LOG_ERROR << "Search query exception: " << e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void ProductController::getProductById(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& id) {
    auto dbClient = drogon::app().getDbClient();
    auto result = dbClient->execSqlSync("SELECT * FROM products WHERE id = $1", id);
    if (result.empty()) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value());
        resp->setStatusCode(drogon::k404NotFound);
        (*resp->jsonObject())["error"] = "Product not found.";
        callback(resp);
        return;
    }

    auto row = result[0];
    Json::Value resJson;
    Json::Value p;
    p["id"] = row["id"].as<std::string>();
    p["name"] = row["name"].as<std::string>();
    p["description"] = row["description"].as<std::string>();
    p["price"] = row["price"].as<double>();
    p["originalPrice"] = row["original_price"].as<double>();
    p["discountPercent"] = row["discount_percent"].as<int>();
    p["category"] = row["category_name"].as<std::string>();
    p["categorySlug"] = row["category_slug"].as<std::string>();
    p["sellerId"] = row["seller_id"].as<std::string>();
    p["sellerName"] = row["seller_name"].as<std::string>();
    p["sellerRating"] = row["seller_rating"].as<double>();
    p["rating"] = row["rating"].as<double>();
    p["reviewCount"] = row["review_count"].as<int>();
    p["stock"] = row["stock"].as<int>();
    p["imageUrl"] = row["image_url"].as<std::string>();
    p["brand"] = row["brand"].as<std::string>();
    p["inStock"] = row["in_stock"].as<bool>();

    resJson["product"] = p;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}

} // namespace prithika_mart
