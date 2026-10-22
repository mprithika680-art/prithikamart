import React, { useState } from 'react';
import { X, Code2, Database, FileText, Cpu, Check, Copy, ExternalLink, Terminal } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const CppArchitectureModal: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('schema.sql');
  const [copied, setCopied] = useState(false);

  const files: Record<string, { label: string; icon: any; code: string }> = {
    'schema.sql': {
      label: 'PostgreSQL Schema (schema.sql)',
      icon: Database,
      code: `-- Prithika Mart - PostgreSQL Relational Database Schema
-- Capstone Project: C++20 / Drogon / PostgreSQL

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'buyer',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_verifications (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2) NOT NULL,
    discount_percent INT DEFAULT 0,
    category_name VARCHAR(64) NOT NULL,
    category_slug VARCHAR(64) NOT NULL,
    seller_id VARCHAR(64) REFERENCES users(id),
    seller_name VARCHAR(128) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url TEXT NOT NULL,
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id),
    customer_name VARCHAR(128) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Confirmed',
    payment_method VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL,
    seller_id VARCHAR(64) NOT NULL
);`,
    },
    'CMakeLists.txt': {
      label: 'CMakeLists.txt (C++20 Build)',
      icon: Cpu,
      code: `cmake_minimum_required(VERSION 3.16)
project(prithika_mart_backend CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Drogon CONFIG REQUIRED)
find_package(PostgreSQL REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(Threads REQUIRED)

add_executable(prithika_mart_server
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

target_link_libraries(prithika_mart_server PRIVATE
    Drogon::Drogon
    PostgreSQL::PostgreSQL
    OpenSSL::SSL
    OpenSSL::Crypto
    Threads::Threads
)`,
    },
    'AuthController.cc': {
      label: 'AuthController.cc (Drogon REST)',
      icon: FileText,
      code: `// MAIN REGISTRATION & OTP VERIFICATION LOGIC (C++20 / Drogon)
#include "AuthController.h"
#include "../services/OtpService.h"
#include "../services/EmailService.h"

void AuthController::registerUser(const drogon::HttpRequestPtr& req, std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    std::string fullName = (*jsonPtr)["fullName"].asString();
    std::string email = (*jsonPtr)["email"].asString();
    std::string password = (*jsonPtr)["password"].asString();
    std::string role = (*jsonPtr).get("role", "buyer").asString();

    auto dbClient = drogon::app().getDbClient();
    std::string passwordHash = AuthService::getInstance().hashPassword(password);

    // Upsert pending user in PostgreSQL
    dbClient->execSqlSync("INSERT INTO users (full_name, email, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, FALSE)",
        fullName, email, passwordHash, role);

    // Generate cryptographic OTP & send via security email
    std::string otpCode = OtpService::getInstance().generateAndStoreOtp(email);
    EmailService::getInstance().sendVerificationEmail(email, fullName, otpCode);

    // CRITICAL: OTP is NEVER returned in HTTP API response
    Json::Value resJson;
    resJson["success"] = true;
    resJson["message"] = "Registration received. Real-time OTP sent to your registered email.";
    resJson["expiresInSeconds"] = 300;

    auto resp = drogon::HttpResponse::newHttpJsonResponse(resJson);
    callback(resp);
}`,
    },
    'OtpService.cc': {
      label: 'OtpService.cc (OpenSSL CSPRNG)',
      icon: Code2,
      code: `// Cryptographically secure OTP generation using OpenSSL CSPRNG (C++20)
#include "OtpService.h"
#include <openssl/rand.h>
#include <openssl/sha.h>

std::string OtpService::generateAndStoreOtp(const std::string& email) {
    unsigned int randomValue = 0;
    RAND_bytes(reinterpret_cast<unsigned char*>(&randomValue), sizeof(randomValue));
    int otpNum = 100000 + (randomValue % 900000);
    std::string otpCode = std::to_string(otpNum);

    // Hash OTP before storing into database table
    std::string hashedOtp = hashOtp(otpCode);
    auto expiresAt = std::chrono::system_clock::now() + std::chrono::minutes(5);

    auto dbClient = drogon::app().getDbClient();
    dbClient->execSqlSync(
        "INSERT INTO otp_verifications (id, email, otp_hash, expires_at, is_used, attempts) "
        "VALUES ($1, $2, $3, $4, FALSE, 0)",
        "otp-" + std::to_string(std::rand()), email, hashedOtp, expiresAt
    );

    return otpCode;
}`,
    },
    'config.json': {
      label: 'config.json (Drogon Server)',
      icon: Terminal,
      code: `{
  "listeners": [
    {
      "address": "0.0.0.0",
      "port": 3000,
      "https": false
    }
  ],
  "db_clients": [
    {
      "name": "default",
      "rdbms": "postgresql",
      "host": "127.0.0.1",
      "port": 5432,
      "dbname": "prithika_mart_db",
      "user": "postgres",
      "passwd": "password",
      "is_fast": true,
      "connection_number": 8
    }
  ],
  "app": {
    "threads_num": 16,
    "upload_path": "./uploads",
    "document_root": "../dist"
  }
}`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div
        id="cpp-architecture-modal-window"
        className="w-full max-w-5xl bg-slate-950 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col text-white"
      >
        {/* Top Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">C++20 / Drogon / PostgreSQL Implementation</h3>
              <p className="text-xs text-slate-400">
                Full-stack Capstone Architecture &middot; REST API Endpoints &middot; Real-Time Security
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-900/50 border-b border-slate-800 overflow-x-auto text-xs font-semibold">
          {Object.entries(files).map(([key, item]) => {
            const Icon = item.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === key
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{key}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content Window */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-300 relative bg-slate-950">
          <div className="flex items-center justify-between mb-3 text-slate-400 text-[11px]">
            <span>{files[activeTab].label}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-x-auto text-[11px] leading-relaxed">
            <code>{files[activeTab].code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Prithika Mart &bull; High Concurrency C++20 Coroutine Backend</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer font-medium"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
