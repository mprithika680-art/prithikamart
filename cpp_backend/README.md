# Prithika Mart - C++20 / Drogon / PostgreSQL Full-Stack Architecture

Prithika Mart is an enterprise-grade multi-seller e-commerce platform built using modern C++20, the high-performance Drogon web framework, and PostgreSQL.

## Architecture Highlights
- **C++20 Standard**: Coroutines, strong typing, RAII, std::optional, and standard chrono libraries.
- **Drogon Framework**: Non-blocking asynchronous event loop with epoll/kqueue network reactor and connection pooling.
- **PostgreSQL Database**: Relational schema with primary & foreign keys, triggers, indexes, and full integrity constraints.
- **Cryptographic Security**: OpenSSL SHA-256 for password hashing and CSPRNG for one-time password (OTP) generation.
- **Zero-Leak OTP Delivery**: OTP codes are strictly sent via SMTP / email delivery outbox and are never returned in JSON API responses or exposed to client-side UI variables.

## Directory Structure
```
cpp_backend/
├── CMakeLists.txt              # C++20 build configuration
├── config.json                 # Drogon listener, threads, and DB pool settings
├── main.cc                     # Application entry point & event loop
├── database/
│   ├── schema.sql              # PostgreSQL DDL tables & indexes
│   └── seed.sql                # Initial data seed (categories, products, demo sellers)
├── models/
│   └── Models.h                # Data structures (User, Product, Order, Cart, etc.)
├── services/
│   ├── OtpService.h/.cc        # Real-time OTP generation & expiry verification
│   ├── EmailService.h/.cc      # SMTP security email dispatcher
│   └── AuthService.h/.cc       # SHA-256 hashing & token session issuance
└── controllers/
    ├── AuthController.h/.cc    # /api/auth/register, /api/auth/verify-otp, /api/auth/login
    ├── ProductController.h/.cc # /api/products, /api/products/search
    ├── CartController.h/.cc    # /api/cart, /api/cart/:id
    ├── WishlistController.h/.cc# /api/wishlist
    ├── OrderController.h/.cc   # /api/checkout, /api/orders
    ├── SellerController.h/.cc  # /api/seller/products, /api/seller/orders
    ├── AdminController.h/.cc   # /api/admin/stats, /api/admin/users
    └── ReviewController.h/.cc  # /api/reviews
```

## Prerequisites
- CMake 3.16+
- GCC 11+ or Clang 13+ (supporting C++20)
- Drogon Framework (`libdrogon-dev` or compiled from source)
- PostgreSQL 14+ (`libpq-dev`)
- OpenSSL 1.1.1+ (`libssl-dev`)

## Quick Build & Run Instructions
```bash
# 1. Initialize PostgreSQL database
psql -U postgres -d postgres -c "CREATE DATABASE prithika_mart_db;"
psql -U postgres -d prithika_mart_db -f database/schema.sql

# 2. Build C++ Drogon Binary
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . -j$(nproc)

# 3. Start Drogon Server
./prithika_mart_server ../config.json
```
The server will bind to `0.0.0.0:8080` (or `3000`) and serve the REST API endpoints.
