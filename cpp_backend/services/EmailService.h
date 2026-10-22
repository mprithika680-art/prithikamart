#pragma once

#include <string>

namespace prithika_mart {

class EmailService {
public:
    static EmailService& getInstance() {
        static EmailService instance;
        return instance;
    }

    // MAIN EMAIL SENDING LOGIC
    // Dispatches verification email with dynamically generated OTP
    bool sendVerificationEmail(const std::string& recipientEmail, const std::string& recipientName, const std::string& otpCode);

private:
    EmailService() = default;
};

} // namespace prithika_mart
