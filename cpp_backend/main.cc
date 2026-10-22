#include <drogon/drogon.h>
#include <iostream>

int main(int argc, char* argv[]) {
    std::cout << "========================================\n";
    std::cout << "   PRITHIKA MART - C++20 DROGON SERVER  \n";
    std::cout << "========================================\n";
    std::cout << "Loading configuration from config.json...\n";

    // Load Drogon configuration (listeners, threads, db_clients)
    std::string configFile = "config.json";
    if (argc > 1) {
        configFile = argv[1];
    }

    try {
        drogon::app().loadConfigFile(configFile);
    } catch (const std::exception& e) {
        std::cerr << "Notice: Falling back to default configuration (" << e.what() << ")\n";
        drogon::app().addListener("0.0.0.0", 8080);
    }

    std::cout << "Starting Prithika Mart Drogon event loop...\n";
    drogon::app().run();
    return 0;
}
