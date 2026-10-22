#include "AuthService.h"
#include <drogon/drogon.h>
#include <openssl/sha.h>
#include <openssl/rand.h>
#include <iomanip>
#include <sstream>

namespace prithika_mart {

std::string AuthService::hashPassword(const std::string& plainPassword) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_CTX sha256;
    SHA256_Init(&sha256);
    SHA256_Update(&sha256, plainPassword.c_str(), plainPassword.length());
    SHA256_Final(hash, &sha256);

    std::stringstream ss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    return ss.str();
}

bool AuthService::verifyPassword(const std::string& plainPassword, const std::string& hashedPassword) {
    return hashPassword(plainPassword) == hashedPassword;
}

// MAIN LOGIN LOGIC
// Authenticates user against PostgreSQL database, verifying email, password hash, and verification status
std::optional<User> AuthService::loginUser(const std::string& email, const std::string& password, std::string& outErrorMessage) {
    auto dbClient = drogon::app().getDbClient();
    if (!dbClient) {
        outErrorMessage = "Database connection unavailable.";
        return std::nullopt;
    }

    try {
        auto result = dbClient->execSqlSync(
            "SELECT id, full_name, email, password_hash, role, is_verified, created_at "
            "FROM users WHERE email = $1",
            email
        );

        if (result.empty()) {
            outErrorMessage = "Invalid email or password.";
            return std::nullopt;
        }

        auto row = result[0];
        std::string storedHash = row["password_hash"].as<std::string>();
        if (!verifyPassword(password, storedHash)) {
            outErrorMessage = "Invalid email or password.";
            return std::nullopt;
        }

        bool isVerified = row["is_verified"].as<bool>();
        if (!isVerified) {
            outErrorMessage = "Account is not verified. Please complete OTP verification.";
            return std::nullopt;
        }

        User user;
        user.id = row["id"].as<std::string>();
        user.fullName = row["full_name"].as<std::string>();
        user.email = row["email"].as<std::string>();
        user.role = stringToUserRole(row["role"].as<std::string>());
        user.isVerified = isVerified;
        user.createdAt = row["created_at"].as<std::string>();

        return user;
    } catch (const std::exception& e) {
        LOG_ERROR << "PostgreSQL login query exception: " << e.what();
        outErrorMessage = "Internal database error.";
        return std::nullopt;
    }
}

std::string AuthService::generateSessionToken(const std::string& userId) {
    unsigned char randomBytes[16];
    RAND_bytes(randomBytes, sizeof(randomBytes));
    std::stringstream ss;
    ss << "pm_tok_";
    for (int i = 0; i < 16; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)randomBytes[i];
    }
    return ss.str();
}

} // namespace prithika_mart
