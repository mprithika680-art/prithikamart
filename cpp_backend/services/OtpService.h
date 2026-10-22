#pragma once

#include <string>
#include <memory>
#include <drogon/drogon.h>
#include "../models/Models.h"

namespace prithika_mart {

class OtpService {
public:
    static OtpService& getInstance() {
        static OtpService instance;
        return instance;
    }

    // MAIN OTP GENERATION LOGIC
    // Generates cryptographically secure 6-digit random code and saves to database
    std::string generateAndStoreOtp(const std::string& email);

    // MAIN OTP VERIFICATION LOGIC
    // Verifies the user submitted OTP against PostgreSQL database record and expiry
    bool verifyOtp(const std::string& email, const std::string& enteredOtp, std::string& outErrorMessage);

private:
    OtpService() = default;
};

} // namespace prithika_mart
