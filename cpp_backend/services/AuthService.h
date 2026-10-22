#pragma once

#include <string>
#include <optional>
#include "../models/Models.h"

namespace prithika_mart {

class AuthService {
public:
    static AuthService& getInstance() {
        static AuthService instance;
        return instance;
    }

    std::string hashPassword(const std::string& plainPassword);
    bool verifyPassword(const std::string& plainPassword, const std::string& hashedPassword);

    // MAIN LOGIN LOGIC
    std::optional<User> loginUser(const std::string& email, const std::string& password, std::string& outErrorMessage);

    std::string generateSessionToken(const std::string& userId);

private:
    AuthService() = default;
};

} // namespace prithika_mart
