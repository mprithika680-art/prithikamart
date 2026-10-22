#include "OtpService.h"
#include <random>
#include <chrono>
#include <openssl/rand.h>

namespace prithika_mart {

// MAIN OTP GENERATION LOGIC
// Generates cryptographically secure 6-digit random code and saves to database
std::string OtpService::generateAndStoreOtp(const std::string& email) {
    // Generate 6-digit numeric OTP using OpenSSL CSPRNG
    unsigned char randomBytes[4];
    RAND_bytes(randomBytes, sizeof(randomBytes));
    uint32_t randomVal = (static_cast<uint32_t>(randomBytes[0]) << 24) |
                         (static_cast<uint32_t>(randomBytes[1]) << 16) |
                         (static_cast<uint32_t>(randomBytes[2]) << 8)  |
                         static_cast<uint32_t>(randomBytes[3]);

    int codeNum = 100000 + (randomVal % 900000);
    std::string otpCode = std::to_string(codeNum);

    // Calculate expiry: 5 minutes from current system clock
    auto dbClient = drogon::app().getDbClient();
    if (dbClient) {
        // Execute parameterized query against PostgreSQL otp_verifications table
        try {
            dbClient->execSqlSync(
                "INSERT INTO otp_verifications (email, otp_code, expires_at, attempts, is_used) "
                "VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '5 minutes', 0, FALSE)",
                email, otpCode
            );
        } catch (const std::exception& e) {
            LOG_ERROR << "PostgreSQL error storing OTP: " << e.what();
        }
    }

    return otpCode;
}

// MAIN OTP VERIFICATION LOGIC
// Verifies user submitted OTP against PostgreSQL database record and expiry
bool OtpService::verifyOtp(const std::string& email, const std::string& enteredOtp, std::string& outErrorMessage) {
    auto dbClient = drogon::app().getDbClient();
    if (!dbClient) {
        outErrorMessage = "Database client unavailable";
        return false;
    }

    try {
        auto result = dbClient->execSqlSync(
            "SELECT id, otp_code, expires_at, attempts, is_used "
            "FROM otp_verifications "
            "WHERE email = $1 AND is_used = FALSE "
            "ORDER BY created_at DESC LIMIT 1",
            email
        );

        if (result.empty()) {
            outErrorMessage = "No active OTP request found for this email.";
            return false;
        }

        auto row = result[0];
        std::string expectedOtp = row["otp_code"].as<std::string>();
        int attempts = row["attempts"].as<int>();
        std::string recordId = row["id"].as<std::string>();

        if (attempts >= 5) {
            outErrorMessage = "Maximum OTP verification attempts exceeded. Please request a new code.";
            return false;
        }

        if (expectedOtp != enteredOtp) {
            dbClient->execSqlSync(
                "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1",
                recordId
            );
            outErrorMessage = "Invalid OTP code. Please enter the correct 6-digit code received in your email.";
            return false;
        }

        // Mark OTP as verified/used
        dbClient->execSqlSync(
            "UPDATE otp_verifications SET is_used = TRUE WHERE id = $1",
            recordId
        );

        // Mark user as verified in PostgreSQL users table
        dbClient->execSqlSync(
            "UPDATE users SET is_verified = TRUE WHERE email = $1",
            email
        );

        return true;
    } catch (const std::exception& e) {
        LOG_ERROR << "PostgreSQL OTP verification exception: " << e.what();
        outErrorMessage = "Database error occurred during verification.";
        return false;
    }
}

} // namespace prithika_mart
