cmake_minimum_required(VERSION 3.16)
project(PrithikaMartServer CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Enable compiler warnings
if(MSVC)
    add_compile_options(/W4 /WX-)
else()
    add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# Find Drogon and dependencies
find_package(Drogon CONFIG REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(PostgreSQL REQUIRED)

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${PostgreSQL_INCLUDE_DIRS}
    ${OPENSSL_INCLUDE_DIR}
)

# Source files
set(SOURCES
    main.cc
    services/OtpService.cc
    services/EmailService.cc
    services/AuthService.cc
    controllers/AuthController.cc
    controllers/ProductController.cc
    controllers/CartController.cc
    controllers/WishlistController.cc
    controllers/OrderController.cc
    controllers/SellerController.cc
    controllers/AdminController.cc
    controllers/ReviewController.cc
)

add_executable(prithika_mart_server ${SOURCES})

target_link_libraries(prithika_mart_server
    PRIVATE
    Drogon::Drogon
    ${PostgreSQL_LIBRARIES}
    OpenSSL::SSL
    OpenSSL::Crypto
    pthread
)
