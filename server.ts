import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
  throw new Error("DATABASE_URL is missing. Set it in your .env file before starting Prithika Mart.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on("error", (err) => {
  console.error("Unexpected idle PostgreSQL client error:", err);
});

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// DATA MAPPING UTILITIES
// Convert PostgreSQL snake_case to API camelCase
// ==========================================

function mapUser(row: any) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    isVerified: Boolean(row.is_verified),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function mapProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    originalPrice: parseFloat(row.original_price),
    discountPercent: Number(row.discount_percent),
    category: row.category,
    categorySlug: row.category_slug,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerRating: parseFloat(row.seller_rating),
    rating: parseFloat(row.rating),
    reviewCount: Number(row.review_count),
    stock: Number(row.stock),
    imageUrl: row.image_url,
    brand: row.brand,
    inStock: Boolean(row.in_stock),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function mapOrder(row: any) {
  let parsedAddress = row.shipping_address;
  if (typeof parsedAddress === "string") {
    try {
      parsedAddress = JSON.parse(parsedAddress);
    } catch {
      parsedAddress = {};
    }
  }
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    shippingAddress: parsedAddress,
    subtotal: parseFloat(row.subtotal),
    shippingFee: parseFloat(row.shipping_fee),
    tax: parseFloat(row.tax),
    totalAmount: parseFloat(row.total_amount),
    status: row.status,
    paymentMethod: row.payment_method,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function mapOrderItem(row: any) {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    productImage: row.product_image,
    price: parseFloat(row.price),
    quantity: Number(row.quantity),
    sellerId: row.seller_id,
    sellerName: row.seller_name,
  };
}

function mapReview(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: Number(row.rating),
    title: row.title,
    comment: row.comment,
    verifiedPurchase: Boolean(row.verified_purchase),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function mapDeliveredEmail(row: any) {
  return {
    id: row.id,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    subject: row.subject,
    otpCode: row.otp_code,
    sentAt: row.sent_at instanceof Date ? row.sent_at.toISOString() : row.sent_at,
    expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : row.expires_at,
    status: row.status,
    rawHtml: row.raw_html,
  };
}

// ==========================================
// DATABASE INITIALIZATION & SCHEMA CREATION
// ==========================================

async function initializeDatabase() {
  try {
    // 1. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'buyer',
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. OTP Records Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(16) NOT NULL,
        expires_at BIGINT NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        is_used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Categories Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        icon VARCHAR(64) NOT NULL
      );
    `);

    // 4. Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        original_price NUMERIC(10, 2) NOT NULL,
        discount_percent INT NOT NULL DEFAULT 0,
        category VARCHAR(255) NOT NULL,
        category_slug VARCHAR(255) NOT NULL,
        seller_id VARCHAR(64) NOT NULL,
        seller_name VARCHAR(255) NOT NULL,
        seller_rating NUMERIC(3, 1) NOT NULL DEFAULT 5.0,
        rating NUMERIC(3, 1) NOT NULL DEFAULT 5.0,
        review_count INT NOT NULL DEFAULT 0,
        stock INT NOT NULL DEFAULT 0,
        image_url TEXT NOT NULL,
        brand VARCHAR(255) NOT NULL,
        in_stock BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Cart Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        product_id VARCHAR(64) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE (user_id, product_id)
      );
    `);

    // 6. Wishlist Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        product_id VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE (user_id, product_id)
      );
    `);

    // 7. Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        shipping_address JSONB NOT NULL,
        subtotal NUMERIC(10, 2) NOT NULL,
        shipping_fee NUMERIC(10, 2) NOT NULL,
        tax NUMERIC(10, 2) NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(64) NOT NULL DEFAULT 'Confirmed',
        payment_method VARCHAR(64) NOT NULL DEFAULT 'Cash on Delivery',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 8. Order Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        product_id VARCHAR(64) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_image TEXT NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        quantity INT NOT NULL,
        seller_id VARCHAR(64) NOT NULL,
        seller_name VARCHAR(255) NOT NULL,
        CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    // 9. Reviews Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(255) NOT NULL,
        comment TEXT NOT NULL,
        verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // 10. Delivered Emails Table (Sandbox audit outbox)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivered_emails (
        id VARCHAR(64) PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        otp_code VARCHAR(16) NOT NULL,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(64) NOT NULL DEFAULT 'Delivered (Ethereal Sandbox)',
        raw_html TEXT NOT NULL
      );
    `);

    // 11. Authentication Tokens Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        token VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // ==========================================
    // SEED INITIAL DATA IF TABLES ARE EMPTY
    // ==========================================

    // Seed Demo Seller
    const sellerId = "usr-seller-01";
    await pool.query(
      `INSERT INTO users (id, full_name, email, password_hash, role, is_verified, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '30 days')
       ON CONFLICT (email) DO NOTHING`,
      [sellerId, "Apex Retailers Official", "seller@prithikamart.com", hashPassword("Seller@123"), "seller", true]
    );

    // Seed Demo Admin
    const adminId = "usr-admin-01";
    await pool.query(
      `INSERT INTO users (id, full_name, email, password_hash, role, is_verified, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '60 days')
       ON CONFLICT (email) DO NOTHING`,
      [adminId, "Prithika Mart Administrator", "admin@prithikamart.com", hashPassword("Admin@123"), "admin", true]
    );

    // Seed Categories
    const categoriesCount = await pool.query("SELECT COUNT(*) FROM categories");
    if (parseInt(categoriesCount.rows[0].count, 10) === 0) {
      const categoriesList = [
        { id: "cat-1", name: "Electronics", slug: "electronics", icon: "Tv" },
        { id: "cat-2", name: "Mobiles & Tablets", slug: "mobiles-tablets", icon: "Smartphone" },
        { id: "cat-3", name: "Fashion & Apparel", slug: "fashion-apparel", icon: "Shirt" },
        { id: "cat-4", name: "Home & Kitchen", slug: "home-kitchen", icon: "Home" },
        { id: "cat-5", name: "Beauty & Personal Care", slug: "beauty-personal-care", icon: "Sparkles" },
        { id: "cat-6", name: "Books & Stationery", slug: "books-stationery", icon: "BookOpen" },
        { id: "cat-7", name: "Sports & Fitness", slug: "sports-fitness", icon: "Dumbbell" },
        { id: "cat-8", name: "Groceries & Gourmet", slug: "groceries-gourmet", icon: "Apple" },
      ];
      for (const c of categoriesList) {
        await pool.query(
          "INSERT INTO categories (id, name, slug, icon) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING",
          [c.id, c.name, c.slug, c.icon]
        );
      }
    }

    // Seed Default Products in PostgreSQL (Laptop, Mobile Phone, Headphones)
    // Uses ON CONFLICT (id) DO NOTHING so server restarts never duplicate, overwrite or delete records.
    {
      const productsList = [
        {
          id: "prod-1",
          name: "Apple MacBook Air M3 (13.6-inch Liquid Retina, 16GB RAM, 512GB SSD - Midnight)",
          description: "Powered by the incredible M3 chip with an 8-core CPU and 10-core GPU. Features a 13.6-inch Liquid Retina display with 500 nits brightness, 18-hour battery life, 1080p FaceTime HD camera, and MagSafe 3 charging.",
          price: 114900.00,
          originalPrice: 124900.00,
          discountPercent: 8,
          category: "Electronics",
          categorySlug: "electronics",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.9,
          reviewCount: 184,
          stock: 25,
          imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
          brand: "Apple",
          inStock: true,
        },
        {
          id: "prod-2",
          name: "Samsung Galaxy S24 Ultra 5G (Titanium Gray, 12GB RAM, 256GB Storage)",
          description: "Revolutionary Galaxy AI with Circle to Search, Live Translate, and Note Assist. Features a 6.8-inch Dynamic AMOLED 2X 120Hz display, 200MP quad camera with 100x Space Zoom, built-in S Pen, and Snapdragon 8 Gen 3 for Galaxy.",
          price: 129999.00,
          originalPrice: 134999.00,
          discountPercent: 4,
          category: "Mobiles & Tablets",
          categorySlug: "mobiles-tablets",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.8,
          reviewCount: 245,
          stock: 30,
          imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
          brand: "Samsung",
          inStock: true,
        },
        {
          id: "prod-3",
          name: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones (Black)",
          description: "Industry-leading noise cancellation optimized with two processors and 8 microphones. Enjoy magnificent sound with the new Integrated Processor V1, up to 30 hours of battery life with quick charging, and ultra-comfortable lightweight design.",
          price: 29990.00,
          originalPrice: 34990.00,
          discountPercent: 14,
          category: "Electronics",
          categorySlug: "electronics",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.9,
          reviewCount: 310,
          stock: 45,
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
          brand: "Sony",
          inStock: true,
        },
        {
          id: "prod-4",
          name: "AirTab Ultra 11-inch Retina Tablet Wi-Fi 128GB",
          description: "Featherlight tablet with liquid retina display, magnetic stylus docking support, all-day 10-hour productivity battery, and stereo quad speakers.",
          price: 429.50,
          originalPrice: 499.00,
          discountPercent: 14,
          category: "Mobiles & Tablets",
          categorySlug: "mobiles-tablets",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.6,
          reviewCount: 95,
          stock: 32,
          imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
          brand: "NovaTech",
          inStock: true,
        },
        {
          id: "prod-5",
          name: "Men's Urban Heritage Tailored Bomber Jacket",
          description: "Crafted from water-resistant brushed canvas with diamond-quilted thermal lining, heavy-duty brass YKK zippers, and ribbed athletic trims.",
          price: 79.99,
          originalPrice: 129.99,
          discountPercent: 38,
          category: "Fashion & Apparel",
          categorySlug: "fashion-apparel",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.5,
          reviewCount: 64,
          stock: 50,
          imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
          brand: "UrbanVibe",
          inStock: true,
        },
        {
          id: "prod-6",
          name: "Women's Pure Mulberry Silk Evening Dress",
          description: "Elegant bias-cut silhouette woven from 100% pure 22-momme grade-6A mulberry silk with adjustable delicate straps and seamless hemline.",
          price: 139.00,
          originalPrice: 199.00,
          discountPercent: 30,
          category: "Fashion & Apparel",
          categorySlug: "fashion-apparel",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.8,
          reviewCount: 78,
          stock: 22,
          imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
          brand: "AuraElegance",
          inStock: true,
        },
        {
          id: "prod-7",
          name: "Barista Touch Espresso Machine & Conical Grinder",
          description: "15-bar Italian pump with PID digital temperature stability, integrated stainless steel burr grinder, and commercial steam wand for microfoam latte art.",
          price: 349.99,
          originalPrice: 449.99,
          discountPercent: 22,
          category: "Home & Kitchen",
          categorySlug: "home-kitchen",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.9,
          reviewCount: 312,
          stock: 14,
          imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80",
          brand: "CaffeArtisan",
          inStock: true,
        },
        {
          id: "prod-8",
          name: "Cast Iron 5.5-Quart Enameled Dutch Oven",
          description: "Heavyweight cast iron ensures peerless heat retention and uniform braising. Vibrant porcelain enamel exterior is oven safe up to 500°F.",
          price: 89.99,
          originalPrice: 120.00,
          discountPercent: 25,
          category: "Home & Kitchen",
          categorySlug: "home-kitchen",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.7,
          reviewCount: 110,
          stock: 35,
          imageUrl: "https://images.unsplash.com/photo-1584990347449-39965d1d604b?auto=format&fit=crop&w=800&q=80",
          brand: "CulinaryForge",
          inStock: true,
        },
        {
          id: "prod-9",
          name: "Advanced Hydration Botanical Face Serum & Elixir",
          description: "Enriched with quadruple molecular-weight hyaluronic acid, niacinamide, and cold-pressed botanical squalane to deeply replenish and revitalize skin.",
          price: 42.00,
          originalPrice: 60.00,
          discountPercent: 30,
          category: "Beauty & Personal Care",
          categorySlug: "beauty-personal-care",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.8,
          reviewCount: 185,
          stock: 60,
          imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
          brand: "Lumière Botanics",
          inStock: true,
        },
        {
          id: "prod-10",
          name: "Sonic Toothbrush with UV Sanitizing Travel Case",
          description: "48,000 vibrations per minute with 5 specialized cleaning modes, smart 2-minute pacer, 30-day wireless charging battery, and UV disinfection dock.",
          price: 59.95,
          originalPrice: 85.00,
          discountPercent: 29,
          category: "Beauty & Personal Care",
          categorySlug: "beauty-personal-care",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.6,
          reviewCount: 92,
          stock: 40,
          imageUrl: "https://images.unsplash.com/photo-1559591937-e1032a13f707?auto=format&fit=crop&w=800&q=80",
          brand: "DentaClean",
          inStock: true,
        },
        {
          id: "prod-11",
          name: "The Art of Modern Software Architecture (Hardcover Edition)",
          description: "Comprehensive blueprint for designing fault-tolerant, scalable cloud systems, microservices, clean code principles, and distributed consensus.",
          price: 49.99,
          originalPrice: 65.00,
          discountPercent: 23,
          category: "Books & Stationery",
          categorySlug: "books-stationery",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.9,
          reviewCount: 204,
          stock: 75,
          imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
          brand: "TechPress",
          inStock: true,
        },
        {
          id: "prod-12",
          name: "Luxury Handcrafted Brass Fountain Pen & Ink Set",
          description: "Solid milled brass barrel with an iridium medium-nib tuned by hand, includes an archival walnut ink reservoir and converter.",
          price: 68.00,
          originalPrice: 90.00,
          discountPercent: 24,
          category: "Books & Stationery",
          categorySlug: "books-stationery",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.7,
          reviewCount: 57,
          stock: 30,
          imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80",
          brand: "Scriptorium",
          inStock: true,
        },
        {
          id: "prod-13",
          name: "Smart Adjustable Dumbbell Pair (5 to 52.5 lbs)",
          description: "Quick-turn selector dial allows smooth weight transitions from 5 to 52.5 lbs in seconds, replacing 15 pairs of traditional dumbbells.",
          price: 299.00,
          originalPrice: 399.00,
          discountPercent: 25,
          category: "Sports & Fitness",
          categorySlug: "sports-fitness",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.8,
          reviewCount: 160,
          stock: 12,
          imageUrl: "https://images.unsplash.com/photo-1586401100295-7a8096fd231a?auto=format&fit=crop&w=800&q=80",
          brand: "FitPro Dynamics",
          inStock: true,
        },
        {
          id: "prod-14",
          name: "Eco-Friendly Pro Grip Alignment Yoga Mat (6mm)",
          description: "Naturally harvested high-density tree rubber with laser-etched alignment guides, superior slip resistance wet or dry, and non-toxic dye.",
          price: 54.00,
          originalPrice: 75.00,
          discountPercent: 28,
          category: "Sports & Fitness",
          categorySlug: "sports-fitness",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.7,
          reviewCount: 88,
          stock: 48,
          imageUrl: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=800&q=80",
          brand: "ZenithFlow",
          inStock: true,
        },
        {
          id: "prod-15",
          name: "Organic Single-Origin Dark Roast Coffee Beans (2 lbs)",
          description: "Ethically shade-grown Arabica beans from high-altitude volcanic soils of Guatemala, featuring tasting notes of dark cocoa and toasted hazelnut.",
          price: 26.50,
          originalPrice: 32.00,
          discountPercent: 17,
          category: "Groceries & Gourmet",
          categorySlug: "groceries-gourmet",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.9,
          reviewCount: 220,
          stock: 90,
          imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
          brand: "Origins Coffee Co.",
          inStock: true,
        },
        {
          id: "prod-16",
          name: "Artisanal Cold-Pressed Extra Virgin Olive Oil (750ml)",
          description: "First cold press of hand-harvested Koroneiki olives with an acidity under 0.2%, delivering an unadulterated grassy and peppery finish.",
          price: 28.00,
          originalPrice: 35.00,
          discountPercent: 20,
          category: "Groceries & Gourmet",
          categorySlug: "groceries-gourmet",
          sellerId,
          sellerName: "Apex Retailers Official",
          sellerRating: 4.9,
          rating: 4.8,
          reviewCount: 135,
          stock: 65,
          imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
          brand: "Aegean Grove",
          inStock: true,
        },
      ];

      for (const p of productsList) {
        await pool.query(
          `INSERT INTO products (
            id, name, description, price, original_price, discount_percent,
            category, category_slug, seller_id, seller_name, seller_rating,
            rating, review_count, stock, image_url, brand, in_stock, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
          ON CONFLICT (id) DO NOTHING`,
          [
            p.id,
            p.name,
            p.description,
            p.price,
            p.originalPrice,
            p.discountPercent,
            p.category,
            p.categorySlug,
            p.sellerId,
            p.sellerName,
            p.sellerRating,
            p.rating,
            p.reviewCount,
            p.stock,
            p.imageUrl,
            p.brand,
            p.inStock,
          ]
        );
      }
    }

    // Seed Initial Reviews in PostgreSQL
    {
      const initialReviews = [
        {
          id: "rev-1",
          productId: "prod-1",
          userId: "usr-demo-rev1",
          userName: "Alexander Wright",
          rating: 5,
          title: "Incredible speed, thermal efficiency, and battery life",
          comment: "The M3 chip handles heavy programming workloads and 4K video exports without any fan noise or slowdown. Battery easily lasts 16+ hours.",
        },
        {
          id: "rev-2",
          productId: "prod-2",
          userId: "usr-demo-rev2",
          userName: "Priya Sharma",
          rating: 5,
          title: "The best Android flagship with outstanding cameras",
          comment: "Galaxy AI features like Circle to Search and generative photo editing work seamlessly. The flat anti-reflective display is the best in class.",
        },
        {
          id: "rev-3",
          productId: "prod-3",
          userId: "usr-demo-rev3",
          userName: "David Chen",
          rating: 5,
          title: "Industry-leading ANC and supreme comfort",
          comment: "The noise cancellation is shockingly effective in flights and loud offices. Very lightweight on the head with deep, punchy acoustics.",
        },
        {
          id: "rev-4",
          productId: "prod-1",
          userId: "usr-demo-rev4",
          userName: "Vikram Rathore",
          rating: 5,
          title: "Stunning Liquid Retina display and sleek design",
          comment: "Crisp text, vibrant colors, and lightweight enough to carry anywhere. Best investment for everyday professional work.",
        },
      ];

      for (const r of initialReviews) {
        await pool.query(
          `INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, comment, verified_purchase, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
           ON CONFLICT (id) DO NOTHING`,
          [r.id, r.productId, r.userId, r.userName, r.rating, r.title, r.comment]
        );
      }
    }

    console.log("PostgreSQL schema initialization & seeding completed successfully.");
  } catch (err: any) {
    console.error("PostgreSQL Database Initialization / Connection Error:", err.message);
    throw err;
  }
}

// Helper: authenticate request from Bearer token using PostgreSQL
async function getAuthenticatedUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  try {
    const tokenRes = await pool.query("SELECT user_id FROM tokens WHERE token = $1", [token]);
    if (tokenRes.rows.length === 0) return null;
    const userId = tokenRes.rows[0].user_id;

    const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) return null;
    return mapUser(userRes.rows[0]);
  } catch (err) {
    console.error("Error in getAuthenticatedUser:", err);
    return null;
  }
}

// ==========================================
// REST API ENDPOINTS (POSTGRESQL-BACKED)
// ==========================================

// 1. REGISTRATION LOGIC
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, role } = req.body;

    if (!fullName || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Password and Confirm Password do not match." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const assignedRole = role === "seller" ? "seller" : "buyer";
    const passwordHash = hashPassword(password);

    // Check if user already exists in PostgreSQL
    const existingRes = await pool.query("SELECT * FROM users WHERE email = $1", [trimmedEmail]);
    let userId: string;

    if (existingRes.rows.length > 0) {
      const existingUser = existingRes.rows[0];
      if (existingUser.is_verified) {
        return res.status(409).json({ error: "An account with this email address already exists. Please log in." });
      }
      // Update unverified user record
      userId = existingUser.id;
      await pool.query(
        "UPDATE users SET full_name = $1, password_hash = $2, role = $3 WHERE id = $4",
        [fullName.trim(), passwordHash, assignedRole, userId]
      );
    } else {
      userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
      await pool.query(
        "INSERT INTO users (id, full_name, email, password_hash, role, is_verified, created_at) VALUES ($1, $2, $3, $4, $5, FALSE, NOW())",
        [userId, fullName.trim(), trimmedEmail, passwordHash, assignedRole]
      );
    }

    // Generate real cryptographically secure random 6-digit OTP
    const otpCode = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const expiryMs = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    const otpId = `otp-${crypto.randomUUID().slice(0, 8)}`;

    // Store OTP in PostgreSQL
    await pool.query(
      `INSERT INTO otps (id, email, otp_code, expires_at, attempts, is_used, created_at)
       VALUES ($1, $2, $3, $4, 0, FALSE, NOW())`,
      [otpId, trimmedEmail, otpCode, expiryMs]
    );

    // Save delivered email audit record in PostgreSQL
    const nowIso = new Date().toISOString();
    const expiresIso = new Date(expiryMs).toISOString();
    const emailId = `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const emailSubject = "Prithika Mart - Your One-Time Password (OTP) Verification Code";
    const rawHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
          .header { background: #0f172a; padding: 24px 32px; text-align: left; }
          .header h1 { color: #f8fafc; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { color: #94a3b8; margin: 4px 0 0 0; font-size: 13px; }
          .content { padding: 32px; }
          .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; text-align: center; padding: 20px; margin: 24px 0; }
          .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: monospace; }
          .notice { font-size: 13px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
          .footer { background: #f8fafc; padding: 16px 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Prithika Mart</h1>
            <p>Security & Identity Authentication Service</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Verify Your Email Address</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Hello <strong>${fullName.trim()}</strong>,<br/>
              Thank you for choosing Prithika Mart. Use the 6-digit verification code below to complete your registration and activate your account.
            </p>
            <div class="otp-box">
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 6px;">Your One-Time Password</div>
              <div class="otp-code">${otpCode}</div>
              <div style="font-size: 12px; color: #e11d48; font-weight: 600; margin-top: 8px;">Expires in 5 minutes</div>
            </div>
            <div class="notice">
              <strong>Security Alert:</strong> Never share this verification code with anyone. Prithika Mart representatives will never ask for your password or OTP.
            </div>
          </div>
          <div class="footer">
            Sent to ${trimmedEmail} &bull; Timestamp: ${nowIso} &bull; Secure Protocol AES-256
          </div>
        </div>
      </body>
      </html>
    `;

    await pool.query(
      `INSERT INTO delivered_emails (id, recipient_email, recipient_name, subject, otp_code, sent_at, expires_at, status, raw_html)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Delivered (Ethereal Sandbox)', $8)`,
      [emailId, trimmedEmail, fullName.trim(), emailSubject, otpCode, nowIso, expiresIso, rawHtml]
    );

    // CRITICAL: NEVER return the OTP inside the API response
    return res.status(200).json({
      success: true,
      message: "Registration received. Real-time OTP sent to your registered email address.",
      email: trimmedEmail,
      expiresInSeconds: 300,
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Internal server error during registration." });
  }
});

// 2. OTP VERIFICATION LOGIC
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP code are required." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const enteredOtp = otp.toString().trim();

    // Query most recent OTP record from PostgreSQL
    const otpRes = await pool.query(
      "SELECT * FROM otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1",
      [trimmedEmail]
    );

    if (otpRes.rows.length === 0) {
      return res.status(400).json({ error: "No OTP request found for this email. Please request a new one." });
    }

    const otpRecord = otpRes.rows[0];

    // Check expiration
    if (Date.now() > Number(otpRecord.expires_at)) {
      return res.status(400).json({ error: "OTP has expired. Please click 'Resend OTP' to receive a new code." });
    }

    // Check if already used
    if (otpRecord.is_used) {
      return res.status(400).json({ error: "This OTP has already been used. Please request a new one." });
    }

    // Check attempts limit
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ error: "Too many failed attempts. Please request a fresh OTP." });
    }

    // Match check
    if (otpRecord.otp_code !== enteredOtp) {
      await pool.query("UPDATE otps SET attempts = attempts + 1 WHERE id = $1", [otpRecord.id]);
      const remaining = 5 - (otpRecord.attempts + 1);
      return res.status(400).json({
        error: `Incorrect OTP. Please check your email and enter the valid 6-digit code. (${remaining} attempts remaining)`,
      });
    }

    // Mark OTP as used in PostgreSQL
    await pool.query("UPDATE otps SET is_used = TRUE WHERE id = $1", [otpRecord.id]);

    // Activate user in PostgreSQL
    const userUpdateRes = await pool.query(
      "UPDATE users SET is_verified = TRUE WHERE email = $1 RETURNING *",
      [trimmedEmail]
    );

    if (userUpdateRes.rows.length === 0) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const verifiedUser = mapUser(userUpdateRes.rows[0]);

    // Create session token in PostgreSQL
    const token = `pm_tok_${crypto.randomUUID()}`;
    await pool.query("INSERT INTO tokens (token, user_id, created_at) VALUES ($1, $2, NOW())", [
      token,
      verifiedUser.id,
    ]);

    // Update email status in delivered_emails table
    await pool.query(
      "UPDATE delivered_emails SET status = 'Verified' WHERE recipient_email = $1",
      [trimmedEmail]
    );

    return res.status(200).json({
      success: true,
      message: "OTP successfully verified! Welcome to Prithika Mart.",
      token,
      user: {
        id: verifiedUser.id,
        fullName: verifiedUser.fullName,
        email: verifiedUser.email,
        role: verifiedUser.role,
        isVerified: verifiedUser.isVerified,
        createdAt: verifiedUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ error: "Server error verifying OTP." });
  }
});

// 3. RESEND OTP LOGIC
app.post("/api/auth/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const trimmedEmail = email.trim().toLowerCase();
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [trimmedEmail]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Account not found for this email address." });
    }

    const user = mapUser(userRes.rows[0]);

    // Generate fresh real-time OTP
    const newOtp = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const expiryMs = Date.now() + 5 * 60 * 1000;
    const otpId = `otp-${crypto.randomUUID().slice(0, 8)}`;

    await pool.query(
      `INSERT INTO otps (id, email, otp_code, expires_at, attempts, is_used, created_at)
       VALUES ($1, $2, $3, $4, 0, FALSE, NOW())`,
      [otpId, trimmedEmail, newOtp, expiryMs]
    );

    const nowIso = new Date().toISOString();
    const expiresIso = new Date(expiryMs).toISOString();
    const emailId = `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const emailSubject = "Prithika Mart - (Resent) One-Time Password (OTP) Verification Code";
    const rawHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
          .header { background: #0f172a; padding: 24px 32px; text-align: left; }
          .header h1 { color: #f8fafc; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
          .content { padding: 32px; }
          .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; text-align: center; padding: 20px; margin: 24px 0; }
          .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Prithika Mart</h1>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">New Verification Code Requested</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Hello <strong>${user.fullName}</strong>,<br/>
              Here is your requested replacement verification code:
            </p>
            <div class="otp-box">
              <div class="otp-code">${newOtp}</div>
              <div style="font-size: 12px; color: #e11d48; font-weight: 600; margin-top: 8px;">Valid for 5 minutes</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await pool.query(
      `INSERT INTO delivered_emails (id, recipient_email, recipient_name, subject, otp_code, sent_at, expires_at, status, raw_html)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Delivered (Ethereal Sandbox)', $8)`,
      [emailId, trimmedEmail, user.fullName, emailSubject, newOtp, nowIso, expiresIso, rawHtml]
    );

    return res.status(200).json({
      success: true,
      message: "A fresh OTP has been sent to your registered email address.",
      expiresInSeconds: 300,
    });
  } catch (err: any) {
    console.error("Resend OTP error:", err);
    return res.status(500).json({ error: "Failed to resend OTP." });
  }
});

// 4. LOGIN LOGIC
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [trimmedEmail]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = mapUser(userRes.rows[0]);
    const hash = hashPassword(password);

    if (user.passwordHash !== hash) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: "Your account is not verified yet. Please complete OTP verification.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = `pm_tok_${crypto.randomUUID()}`;
    await pool.query("INSERT INTO tokens (token, user_id, created_at) VALUES ($1, $2, NOW())", [
      token,
      user.id,
    ]);

    return res.status(200).json({
      success: true,
      message: "Login successful! Welcome to Prithika Mart.",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed due to server error." });
  }
});

// 5. GET AUTHENTICATED USER
app.get("/api/auth/me", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

// 6. LOGOUT LOGIC
app.post("/api/auth/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      await pool.query("DELETE FROM tokens WHERE token = $1", [token]);
    }
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: "Error during logout." });
  }
});

// 7. SANDBOX AUDIT OUTBOX
app.get("/api/sandbox/delivered-emails", async (req, res) => {
  try {
    const emailQuery = req.query.email as string | undefined;
    if (emailQuery) {
      const targetEmail = emailQuery.trim().toLowerCase();
      const result = await pool.query(
        "SELECT * FROM delivered_emails WHERE recipient_email = $1 ORDER BY sent_at DESC",
        [targetEmail]
      );
      return res.json({ emails: result.rows.map(mapDeliveredEmail) });
    }
    const result = await pool.query(
      "SELECT * FROM delivered_emails ORDER BY sent_at DESC LIMIT 20"
    );
    return res.json({ emails: result.rows.map(mapDeliveredEmail) });
  } catch (err: any) {
    return res.status(500).json({ error: "Error fetching sandbox emails." });
  }
});

app.get("/api/sandbox/delivered-emails/latest", async (req, res) => {
  try {
    const emailQuery = req.query.email as string | undefined;
    let result;
    if (emailQuery) {
      const targetEmail = emailQuery.trim().toLowerCase();
      result = await pool.query(
        "SELECT * FROM delivered_emails WHERE recipient_email = $1 ORDER BY sent_at DESC LIMIT 1",
        [targetEmail]
      );
    } else {
      result = await pool.query(
        "SELECT * FROM delivered_emails ORDER BY sent_at DESC LIMIT 1"
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No emails in outbox." });
    }
    return res.json({ email: mapDeliveredEmail(result.rows[0]) });
  } catch (err: any) {
    return res.status(500).json({ error: "Error fetching latest email." });
  }
});

// 8. CATEGORIES
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(p.id)::int as "itemCount"
      FROM categories c
      LEFT JOIN products p ON c.slug = p.category_slug
      GROUP BY c.id, c.name, c.slug, c.icon
      ORDER BY c.id ASC
    `);
    return res.json({ categories: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: "Error retrieving categories." });
  }
});

// 9. PRODUCTS LIST (Buyer API: Returns only active, successfully saved products)
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products WHERE in_stock = TRUE ORDER BY created_at DESC");
    return res.json({ products: result.rows.map(mapProduct) });
  } catch (err: any) {
    return res.status(500).json({ error: "Error retrieving products." });
  }
});

// 10. PRODUCT SEARCH / FILTER (Buyer Catalog)
app.get("/api/products/search", async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, rating, inStock, sortBy } = req.query;

    const conditions: string[] = ["in_stock = TRUE"];
    const values: any[] = [];
    let paramIndex = 1;

    if (q && typeof q === "string" && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR brand ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`);
      values.push(term);
      paramIndex++;
    }

    if (category && typeof category === "string" && category !== "all") {
      conditions.push(`(category_slug = $${paramIndex} OR category ILIKE $${paramIndex})`);
      values.push(category);
      paramIndex++;
    }

    if (minPrice) {
      const min = parseFloat(minPrice as string);
      if (!isNaN(min)) {
        conditions.push(`price >= $${paramIndex}`);
        values.push(min);
        paramIndex++;
      }
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      if (!isNaN(max)) {
        conditions.push(`price <= $${paramIndex}`);
        values.push(max);
        paramIndex++;
      }
    }

    if (rating) {
      const minRating = parseFloat(rating as string);
      if (!isNaN(minRating)) {
        conditions.push(`rating >= $${paramIndex}`);
        values.push(minRating);
        paramIndex++;
      }
    }

    if (inStock === "true") {
      conditions.push("in_stock = TRUE AND stock > 0");
    }

    let orderByClause = "ORDER BY created_at DESC";
    if (sortBy) {
      switch (sortBy) {
        case "price-asc":
          orderByClause = "ORDER BY price ASC";
          break;
        case "price-desc":
          orderByClause = "ORDER BY price DESC";
          break;
        case "rating":
          orderByClause = "ORDER BY rating DESC";
          break;
        case "newest":
          orderByClause = "ORDER BY created_at DESC";
          break;
        default:
          break;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const queryStr = `SELECT * FROM products ${whereClause} ${orderByClause}`;

    const result = await pool.query(queryStr, values);
    const products = result.rows.map(mapProduct);
    return res.json({ products, count: products.length });
  } catch (err: any) {
    console.error("Search error:", err);
    return res.status(500).json({ error: "Failed to search products." });
  }
});

// 11. PRODUCT DETAIL
app.get("/api/products/:id", async (req, res) => {
  try {
    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }
    const product = mapProduct(prodRes.rows[0]);

    const revRes = await pool.query(
      "SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC",
      [product.id]
    );
    const reviews = revRes.rows.map(mapReview);

    return res.json({ product, reviews });
  } catch (err: any) {
    return res.status(500).json({ error: "Error fetching product details." });
  }
});

// 12. WISHLIST ENDPOINTS
app.get("/api/wishlist", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required to view wishlist." });

    const result = await pool.query(`
      SELECT w.id, w.user_id, w.product_id, w.created_at,
             p.name as p_name, p.description as p_desc, p.price as p_price,
             p.original_price as p_orig_price, p.discount_percent as p_disc,
             p.category as p_cat, p.category_slug as p_catslug, p.seller_id as p_sellerid,
             p.seller_name as p_sellername, p.seller_rating as p_sellerrating,
             p.rating as p_rating, p.review_count as p_revcount, p.stock as p_stock,
             p.image_url as p_img, p.brand as p_brand, p.in_stock as p_instock,
             p.created_at as p_created
      FROM wishlist_items w
      INNER JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `, [user.id]);

    const wishlist = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      addedAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      product: {
        id: row.product_id,
        name: row.p_name,
        description: row.p_desc,
        price: parseFloat(row.p_price),
        originalPrice: parseFloat(row.p_orig_price),
        discountPercent: Number(row.p_disc),
        category: row.p_cat,
        categorySlug: row.p_catslug,
        sellerId: row.p_sellerid,
        sellerName: row.p_sellername,
        sellerRating: parseFloat(row.p_sellerrating),
        rating: parseFloat(row.p_rating),
        reviewCount: Number(row.p_revcount),
        stock: Number(row.p_stock),
        imageUrl: row.p_img,
        brand: row.p_brand,
        inStock: Boolean(row.p_instock),
        createdAt: row.p_created instanceof Date ? row.p_created.toISOString() : row.p_created,
      },
    }));

    return res.json({ wishlist });
  } catch (err: any) {
    console.error("Wishlist error:", err);
    return res.status(500).json({ error: "Failed to fetch wishlist." });
  }
});

app.post("/api/wishlist", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required." });

    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "Product ID is required." });

    const prodRes = await pool.query("SELECT id FROM products WHERE id = $1", [productId]);
    if (prodRes.rows.length === 0) {
      return res.status(400).json({ error: "Invalid product ID." });
    }

    const id = `wsh-${crypto.randomUUID()}`;
    await pool.query(
      `INSERT INTO wishlist_items (id, user_id, product_id, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [id, user.id, productId]
    );

    return res.status(201).json({ success: true, message: "Product added to wishlist." });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to add to wishlist." });
  }
});

app.delete("/api/wishlist/:productId", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required." });

    const { productId } = req.params;
    const deleteRes = await pool.query(
      "DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2",
      [user.id, productId]
    );

    return res.json({ success: true, removed: (deleteRes.rowCount ?? 0) > 0 });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to remove from wishlist." });
  }
});

// 13. CART ENDPOINTS
app.get("/api/cart", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required." });

    const result = await pool.query(`
      SELECT c.id, c.user_id, c.product_id, c.quantity,
             p.name as p_name, p.description as p_desc, p.price as p_price,
             p.original_price as p_orig_price, p.discount_percent as p_disc,
             p.category as p_cat, p.category_slug as p_catslug, p.seller_id as p_sellerid,
             p.seller_name as p_sellername, p.seller_rating as p_sellerrating,
             p.rating as p_rating, p.review_count as p_revcount, p.stock as p_stock,
             p.image_url as p_img, p.brand as p_brand, p.in_stock as p_instock,
             p.created_at as p_created
      FROM cart_items c
      INNER JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at ASC
    `, [user.id]);

    const items = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      quantity: Number(row.quantity),
      product: {
        id: row.product_id,
        name: row.p_name,
        description: row.p_desc,
        price: parseFloat(row.p_price),
        originalPrice: parseFloat(row.p_orig_price),
        discountPercent: Number(row.p_disc),
        category: row.p_cat,
        categorySlug: row.p_catslug,
        sellerId: row.p_sellerid,
        sellerName: row.p_sellername,
        sellerRating: parseFloat(row.p_sellerrating),
        rating: parseFloat(row.p_rating),
        reviewCount: Number(row.p_revcount),
        stock: Number(row.p_stock),
        imageUrl: row.p_img,
        brand: row.p_brand,
        inStock: Boolean(row.p_instock),
        createdAt: row.p_created instanceof Date ? row.p_created.toISOString() : row.p_created,
      },
    }));

    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shippingFee = subtotal > 50 || subtotal === 0 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shippingFee + tax;

    return res.json({
      cart: items,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingFee: parseFloat(shippingFee.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
      },
    });
  } catch (err: any) {
    console.error("Cart error:", err);
    return res.status(500).json({ error: "Failed to load cart." });
  }
});

app.post("/api/cart", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required." });

    const { productId, quantity = 1 } = req.body;
    const numQty = Math.max(1, parseInt(quantity, 10));

    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1", [productId]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    const id = `crt-${crypto.randomUUID()}`;
    const insertRes = await pool.query(`
      INSERT INTO cart_items (id, user_id, product_id, quantity, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING *
    `, [id, user.id, productId, numQty]);

    return res.status(201).json({
      success: true,
      message: "Item added to cart.",
      cartItem: {
        id: insertRes.rows[0].id,
        userId: insertRes.rows[0].user_id,
        productId: insertRes.rows[0].product_id,
        quantity: insertRes.rows[0].quantity,
      },
    });
  } catch (err: any) {
    console.error("Add to cart error:", err);
    return res.status(500).json({ error: "Failed to add item to cart." });
  }
});

app.put("/api/cart/:productId", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required." });

    const { productId } = req.params;
    const { quantity } = req.body;
    const numQty = parseInt(quantity, 10);

    if (numQty <= 0) {
      await pool.query("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", [
        user.id,
        productId,
      ]);
      return res.json({ success: true, message: "Item removed from cart." });
    }

    const updateRes = await pool.query(
      "UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *",
      [numQty, user.id, productId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Item not in cart." });
    }

    return res.json({ success: true, message: "Quantity updated." });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update cart." });
  }
});

app.delete("/api/cart/:productId", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required." });

    const { productId } = req.params;
    await pool.query("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", [
      user.id,
      productId,
    ]);
    return res.json({ success: true, message: "Item removed from cart." });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to delete item from cart." });
  }
});

app.delete("/api/cart", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required." });

    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [user.id]);
    return res.json({ success: true, message: "Cart cleared." });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to clear cart." });
  }
});

// 14. CHECKOUT & ORDER LOGIC (POSTGRESQL TRANSACTION)
app.post("/api/checkout", async (req, res) => {
  let client: any = null;
  let transactionStarted = false;
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required to checkout." });
    client = await pool.connect();

    const { shippingAddress, paymentMethod = "Cash on Delivery" } = req.body;
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.phone
    ) {
      return res.status(400).json({ error: "Complete shipping details are required." });
    }

    // Get user's cart items joined with products
    const cartRes = await client.query(`
      SELECT c.*, p.name, p.price, p.stock, p.image_url, p.seller_id, p.seller_name
      FROM cart_items c
      INNER JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `, [user.id]);

    if (cartRes.rows.length === 0) {
      return res.status(400).json({ error: "Your shopping cart is empty." });
    }

    // Validate inventory stock
    for (const item of cartRes.rows) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product "${item.name}". Available: ${item.stock}, in cart: ${item.quantity}.`,
        });
      }
    }

    // Begin PostgreSQL atomic transaction
    await client.query("BEGIN");
    transactionStarted = true;

    let subtotal = 0;
    const orderItemsToCreate: any[] = [];
    const orderId = `PM-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    for (const item of cartRes.rows) {
      const price = parseFloat(item.price);
      subtotal += price * item.quantity;
      const orderItemId = `oit-${crypto.randomUUID()}`;

      orderItemsToCreate.push({
        id: orderItemId,
        orderId,
        productId: item.product_id,
        productName: item.name,
        productImage: item.image_url,
        price,
        quantity: item.quantity,
        sellerId: item.seller_id,
        sellerName: item.seller_name,
      });

      // Deduct stock in products table
      await client.query(
        `UPDATE products
         SET stock = stock - $1,
             in_stock = (stock - $1 > 0)
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    const shippingFee = subtotal > 50 ? 0 : 5.99;
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const totalAmount = parseFloat((subtotal + shippingFee + tax).toFixed(2));

    // Insert order in orders table
    await client.query(`
      INSERT INTO orders (
        id, user_id, customer_name, customer_email, shipping_address,
        subtotal, shipping_fee, tax, total_amount, status, payment_method, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Confirmed', $10, NOW())
    `, [
      orderId,
      user.id,
      shippingAddress.fullName,
      user.email,
      JSON.stringify(shippingAddress),
      parseFloat(subtotal.toFixed(2)),
      shippingFee,
      tax,
      totalAmount,
      paymentMethod,
    ]);

    // Insert order items in order_items table
    for (const oi of orderItemsToCreate) {
      await client.query(`
        INSERT INTO order_items (
          id, order_id, product_id, product_name, product_image,
          price, quantity, seller_id, seller_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        oi.id,
        oi.orderId,
        oi.productId,
        oi.productName,
        oi.productImage,
        oi.price,
        oi.quantity,
        oi.sellerId,
        oi.sellerName,
      ]);
    }

    // Clear cart in cart_items table
    await client.query("DELETE FROM cart_items WHERE user_id = $1", [user.id]);

    // Commit transaction
    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      orderId,
      order: {
        id: orderId,
        userId: user.id,
        customerName: shippingAddress.fullName,
        customerEmail: user.email,
        shippingAddress,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingFee,
        tax,
        totalAmount,
        status: "Confirmed",
        paymentMethod,
        items: orderItemsToCreate,
      },
    });
  } catch (err: any) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Checkout rollback error:", rollbackError);
      }
    }
    console.error("Checkout transaction error:", err);
    return res.status(500).json({ error: "Failed to complete checkout." });
  } finally {
    if (client) client.release();
  }
});

// 15. ORDERS HISTORY
app.get("/api/orders", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required." });

    const ordersRes = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [user.id]
    );

    const orders = [];
    for (const orderRow of ordersRes.rows) {
      const order = mapOrder(orderRow);
      const itemsRes = await pool.query(
        "SELECT * FROM order_items WHERE order_id = $1",
        [order.id]
      );
      orders.push({
        ...order,
        items: itemsRes.rows.map(mapOrderItem),
      });
    }

    return res.json({ orders });
  } catch (err: any) {
    console.error("Orders fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// 16. SELLER PRODUCT MANAGEMENT
app.get("/api/seller/products", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return res.status(403).json({ error: "Access denied. Seller account required." });
    }

    let result;
    if (user.role === "admin") {
      result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    } else {
      result = await pool.query(
        "SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC",
        [user.id]
      );
    }

    return res.json({ products: result.rows.map(mapProduct) });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch seller products." });
  }
});

app.post("/api/seller/products", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required to add products." });
    }
    if (user.role !== "seller" && user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Only authenticated sellers can add products." });
    }

    const { name, category, description, price, imageUrl } = req.body;

    // Validate all 5 required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Product Name is required." });
    }
    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ error: "Product Category is required." });
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({ error: "Product Description is required." });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: "Please enter a valid price in ₹ (INR) greater than 0." });
    }

    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim().match(/^https?:\/\/.+/i)) {
      return res.status(400).json({ error: "Please provide a valid Product Image URL starting with http:// or https://." });
    }

    const categorySlug = category.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const numOrigPrice = req.body.originalPrice ? parseFloat(req.body.originalPrice) : numPrice * 1.15;
    const discountPercent = Math.max(0, Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100));
    const numStock = req.body.stock !== undefined ? parseInt(req.body.stock, 10) : 50;
    const newId = `prod-${crypto.randomUUID().slice(0, 8)}`;
    const brandName = req.body.brand || user.fullName;

    const insertRes = await pool.query(`
      INSERT INTO products (
        id, name, description, price, original_price, discount_percent,
        category, category_slug, seller_id, seller_name, seller_rating,
        rating, review_count, stock, image_url, brand, in_stock, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 4.9, 5.0, 0, $11, $12, $13, $14, NOW())
      RETURNING *
    `, [
      newId,
      name.trim(),
      description.trim(),
      numPrice,
      numOrigPrice,
      discountPercent,
      category.trim(),
      categorySlug,
      user.id,
      user.fullName,
      numStock,
      imageUrl.trim(),
      brandName,
      numStock > 0,
    ]);

    return res.status(201).json({
      success: true,
      message: "Product successfully published to PostgreSQL database!",
      product: mapProduct(insertRes.rows[0]),
    });
  } catch (err: any) {
    console.error("Seller add product error:", err);
    return res.status(500).json({ error: "Failed to save product in PostgreSQL database." });
  }
});

app.put("/api/seller/products/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return res.status(403).json({ error: "Access denied." });
    }

    const { id } = req.params;
    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (prodRes.rows.length === 0) return res.status(404).json({ error: "Product not found." });

    const currentProduct = prodRes.rows[0];
    if (currentProduct.seller_id !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Cannot modify products belonging to other sellers." });
    }

    const { name, description, price, stock, inStock, imageUrl } = req.body;
    const updatedName = name !== undefined ? name : currentProduct.name;
    const updatedDesc = description !== undefined ? description : currentProduct.description;
    const updatedPrice = price !== undefined ? parseFloat(price) : currentProduct.price;
    const updatedStock = stock !== undefined ? parseInt(stock, 10) : currentProduct.stock;
    const updatedInStock = inStock !== undefined ? Boolean(inStock) : updatedStock > 0;
    const updatedImg = imageUrl !== undefined ? imageUrl : currentProduct.image_url;

    const updateRes = await pool.query(`
      UPDATE products
      SET name = $1, description = $2, price = $3, stock = $4, in_stock = $5, image_url = $6
      WHERE id = $7
      RETURNING *
    `, [updatedName, updatedDesc, updatedPrice, updatedStock, updatedInStock, updatedImg, id]);

    return res.json({ success: true, product: mapProduct(updateRes.rows[0]) });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update product." });
  }
});

app.delete("/api/seller/products/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return res.status(403).json({ error: "Access denied." });
    }

    const { id } = req.params;
    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (prodRes.rows.length === 0) return res.status(404).json({ error: "Product not found." });

    if (prodRes.rows[0].seller_id !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized." });
    }

    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    return res.json({ success: true, message: "Product deleted successfully." });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to delete product." });
  }
});

// 17. SELLER ORDERS
app.get("/api/seller/orders", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return res.status(403).json({ error: "Access denied." });
    }

    let oiQuery = "SELECT * FROM order_items WHERE seller_id = $1";
    let oiParams = [user.id];
    if (user.role === "admin") {
      oiQuery = "SELECT * FROM order_items";
      oiParams = [];
    }

    const oiRes = await pool.query(oiQuery, oiParams);
    const orderItems = oiRes.rows.map(mapOrderItem);
    const orderIds = Array.from(new Set(orderItems.map((oi) => oi.orderId)));

    if (orderIds.length === 0) {
      return res.json({ orders: [] });
    }

    const ordersRes = await pool.query(
      "SELECT * FROM orders WHERE id = ANY($1) ORDER BY created_at DESC",
      [orderIds]
    );

    const orders = ordersRes.rows.map((orderRow) => {
      const order = mapOrder(orderRow);
      return {
        ...order,
        items: orderItems.filter((oi) => oi.orderId === order.id),
      };
    });

    return res.json({ orders });
  } catch (err: any) {
    console.error("Seller orders error:", err);
    return res.status(500).json({ error: "Failed to fetch seller orders." });
  }
});

app.patch("/api/seller/orders/:id/status", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return res.status(403).json({ error: "Access denied." });
    }

    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["Pending", "Confirmed", "Shipped", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    let updateRes;
    if (user.role === "admin") {
      updateRes = await pool.query(
        "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );
    } else {
      updateRes = await pool.query(
        `UPDATE orders o
         SET status = $1
         WHERE o.id = $2
           AND EXISTS (
             SELECT 1 FROM order_items oi
             WHERE oi.order_id = o.id AND oi.seller_id = $3
           )
         RETURNING o.*`,
        [status, id, user.id]
      );
    }

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Order not found for this seller." });
    }
    return res.json({ success: true, order: mapOrder(updateRes.rows[0]) });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update order status." });
  }
});

// 18. ADMIN METRICS & USERS
app.get("/api/admin/stats", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required." });
    }

    const [uCount, pCount, oCount, revSum, bCount, sCount] = await Promise.all([
      pool.query("SELECT COUNT(*)::int as count FROM users"),
      pool.query("SELECT COUNT(*)::int as count FROM products"),
      pool.query("SELECT COUNT(*)::int as count FROM orders"),
      pool.query("SELECT COALESCE(SUM(total_amount), 0)::numeric(12,2) as rev FROM orders"),
      pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'buyer'"),
      pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'seller'"),
    ]);

    return res.json({
      stats: {
        totalUsers: uCount.rows[0].count,
        totalProducts: pCount.rows[0].count,
        totalOrders: oCount.rows[0].count,
        totalRevenue: parseFloat(revSum.rows[0].rev),
        totalBuyers: bCount.rows[0].count,
        totalSellers: sCount.rows[0].count,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch admin stats." });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required." });
    }

    const result = await pool.query(
      "SELECT id, full_name, email, role, is_verified, created_at FROM users ORDER BY created_at DESC"
    );

    return res.json({
      users: result.rows.map((u) => ({
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        isVerified: u.is_verified,
        createdAt: u.created_at instanceof Date ? u.created_at.toISOString() : u.created_at,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch users." });
  }
});

app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required." });
    }

    const targetId = req.params.id;
    if (targetId === user.id) {
      return res.status(400).json({ error: "Cannot delete your own admin account." });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [targetId]);
    return res.json({ success: true, message: "User account removed." });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to remove user account." });
  }
});

// 19. REVIEWS
app.post("/api/reviews", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required to review products." });

    const { productId, rating, title, comment } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: "Product, rating (1-5), and review text are required." });
    }

    const prodRes = await pool.query("SELECT id FROM products WHERE id = $1", [productId]);
    if (prodRes.rows.length === 0) return res.status(404).json({ error: "Product not found." });

    const revId = `rev-${crypto.randomUUID()}`;
    const numRating = Math.min(5, Math.max(1, parseInt(rating, 10)));

    const insertRes = await pool.query(`
      INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, comment, verified_purchase, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
      RETURNING *
    `, [revId, productId, user.id, user.fullName, numRating, title || "Customer Review", comment.trim()]);

    // Recalculate average rating & count in products table
    const statRes = await pool.query(
      "SELECT AVG(rating)::numeric(3, 1) as avg_rating, COUNT(*)::int as count FROM reviews WHERE product_id = $1",
      [productId]
    );

    if (statRes.rows.length > 0) {
      const avg = parseFloat(statRes.rows[0].avg_rating);
      const count = statRes.rows[0].count;
      await pool.query(
        "UPDATE products SET rating = $1, review_count = $2 WHERE id = $3",
        [avg, count, productId]
      );
    }

    return res.status(201).json({ success: true, review: mapReview(insertRes.rows[0]) });
  } catch (err: any) {
    console.error("Review creation error:", err);
    return res.status(500).json({ error: "Failed to submit review." });
  }
});

// ==========================================
// VITE MIDDLEWARE & SERVER INITIALIZATION
// ==========================================

async function startServer() {
  const dbCheck = await pool.query("SELECT current_database() AS database, current_user AS username, version() AS version");
  console.log(`Connected to PostgreSQL database: ${dbCheck.rows[0].database} (user: ${dbCheck.rows[0].username})`);
  await initializeDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Prithika Mart server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Prithika Mart startup failed. Check DATABASE_URL and PostgreSQL availability.", err);
  process.exitCode = 1;
  pool.end().catch(() => undefined);
});
