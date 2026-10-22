#pragma once

#include <drogon/HttpController.h>

namespace prithika_mart {

class ReviewController : public drogon::HttpController<ReviewController> {
public:
    METHOD_LIST_BEGIN
    // MAIN REVIEW LOGIC
    ADD_METHOD_TO(ReviewController::createReview, "/api/reviews", drogon::Post);
    ADD_METHOD_TO(ReviewController::getProductReviews, "/api/reviews/product/{productId}", drogon::Get);
    METHOD_LIST_END

    void createReview(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback);
    void getProductReviews(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback, const std::string& productId);
};

} // namespace prithika_mart
