#pragma once

#include <string>
#include <vector>
#include <optional>
#include <chrono>

namespace prithika_mart {

enum class UserRole {
    Buyer,
    Seller,
    Admin
};

inline std::string userRoleToString(UserRole role) {
    switch (role) {
        case UserRole::Buyer: return "buyer";
        case UserRole::Seller: return "seller";
        case UserRole::Admin: return "admin";
    }
    return "buyer";
}

inline UserRole stringToUserRole(const std::string& str) {
    if (str == "seller") return UserRole::Seller;
    if (str == "admin") return UserRole::Admin;
    return UserRole::Buyer;
}

struct User {
    std::string id;
    std::string fullName;
    std::string email;
    std::string passwordHash;
    UserRole role;
    bool isVerified{false};
    std::string createdAt;
};

struct OtpRecord {
    std::string id;
    std::string email;
    std::string otpCode;
    std::chrono::system_clock::time_point expiresAt;
    int attempts{0};
    bool isUsed{false};
};

struct Product {
    std::string id;
    std::string name;
    std::string description;
    double price{0.0};
    double originalPrice{0.0};
    int discountPercent{0};
    std::string categoryId;
    std::string categoryName;
    std::string categorySlug;
    std::string sellerId;
    std::string sellerName;
    double sellerRating{4.9};
    double rating{5.0};
    int reviewCount{0};
    int stock{0};
    std::string imageUrl;
    std::string brand;
    bool inStock{true};
    std::string createdAt;
};

struct CartItem {
    std::string id;
    std::string userId;
    std::string productId;
    int quantity{1};
    std::string createdAt;
};

struct WishlistItem {
    std::string id;
    std::string userId;
    std::string productId;
    std::string createdAt;
};

struct OrderItem {
    std::string id;
    std::string orderId;
    std::string productId;
    std::string productName;
    std::string productImage;
    double price{0.0};
    int quantity{1};
    std::string sellerId;
    std::string sellerName;
};

struct Order {
    std::string id;
    std::string userId;
    std::string customerName;
    std::string customerEmail;
    std::string shippingStreet;
    std::string shippingCity;
    std::string shippingState;
    std::string shippingZip;
    std::string shippingPhone;
    double subtotal{0.0};
    double shippingFee{0.0};
    double tax{0.0};
    double totalAmount{0.0};
    std::string status{"Confirmed"};
    std::string paymentMethod{"Cash on Delivery"};
    std::string createdAt;
    std::vector<OrderItem> items;
};

struct Review {
    std::string id;
    std::string productId;
    std::string userId;
    std::string userName;
    int rating{5};
    std::string title;
    std::string comment;
    bool verifiedPurchase{true};
    std::string createdAt;
};

} // namespace prithika_mart
