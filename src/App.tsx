import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  PackageX,
  RefreshCw,
} from 'lucide-react';
import { User, Product, Category, CartItem, WishlistItem } from './types';
import { api, clearStoredToken } from './services/api';
import { Navbar } from './components/Navbar';
import { BannerCarousel } from './components/BannerCarousel';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrdersModal } from './components/OrdersModal';
import { WishlistModal } from './components/WishlistModal';
import { SellerDashboard } from './components/SellerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { CppArchitectureModal } from './components/CppArchitectureModal';
import { RegistrationModal } from './components/RegistrationModal';
import { OtpVerificationModal } from './components/OtpVerificationModal';
import { SandboxEmailModal } from './components/SandboxEmailModal';
import { LoginModal } from './components/LoginModal';

export function App() {
  // Authentication State (Enforce first-launch registration)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'register' | 'otp' | 'login' | 'authenticated'>('register');
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [showSandboxEmail, setShowSandboxEmail] = useState<boolean>(false);

  // Marketplace State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  // Cart & Wishlist State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartSummary, setCartSummary] = useState({ subtotal: 0, shippingFee: 0, tax: 0, total: 0 });
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [showOrdersModal, setShowOrdersModal] = useState<boolean>(false);
  const [showWishlistModal, setShowWishlistModal] = useState<boolean>(false);
  const [showSellerDashboard, setShowSellerDashboard] = useState<boolean>(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);
  const [showCppArchitecture, setShowCppArchitecture] = useState<boolean>(false);

  // Initialize session & catalog
  useEffect(() => {
    async function initApp() {
      // 1. Check if an active session already exists
      try {
        const meRes = await api.getMe();
        if (meRes.user) {
          setCurrentUser(meRes.user);
          setAuthView('authenticated');
        } else {
          setAuthView('register');
        }
      } catch {
        // Enforce First-Launch Registration Flow
        setAuthView('register');
      }

      // 2. Fetch categories & initial products
      try {
        const [catRes, prodRes] = await Promise.all([
          api.getCategories(),
          api.getProducts(),
        ]);
        if (catRes.categories) setCategories(catRes.categories);
        if (prodRes.products) setProducts(prodRes.products);
      } catch (err) {
        console.error('Failed to load initial catalog:', err);
      }
    }
    initApp();
  }, []);

  // Sync Cart & Wishlist when authenticated
  const syncUserData = async () => {
    try {
      const [cartRes, wishRes] = await Promise.all([
        api.getCart(),
        api.getWishlist(),
      ]);
      if (cartRes.cart) {
        setCart(cartRes.cart);
        setCartSummary(cartRes.summary);
      }
      if (wishRes.wishlist) {
        setWishlist(wishRes.wishlist);
      }
    } catch (err) {
      console.error('Failed to sync user cart/wishlist:', err);
    }
  };

  useEffect(() => {
    if (authView === 'authenticated') {
      syncUserData();
    }
  }, [authView]);

  // Handle Search & Filtering
  const executeSearch = async () => {
    try {
      setLoadingProducts(true);
      // Fetch products from the existing GET /api/products endpoint for default view
      if (!searchQuery.trim() && selectedCategory === 'all' && !inStockOnly && sortBy === 'featured') {
        const res = await api.getProducts();
        if (res.products) {
          setProducts(res.products);
          return;
        }
      }

      const res = await api.searchProducts({
        q: searchQuery.trim() || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        inStock: inStockOnly || undefined,
        sortBy,
      });
      if (res.products) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [selectedCategory, sortBy, inStockOnly]);

  // Auth Flow Handlers
  const handleRegistrationSuccess = (registeredEmail: string) => {
    setPendingEmail(registeredEmail);
    setAuthView('otp');
  };

  const handleVerificationSuccess = (user: User) => {
    setCurrentUser(user);
    setAuthView('authenticated');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setAuthView('authenticated');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearStoredToken();
      setCurrentUser(null);
      setAuthView('login');
    }
  };

  // Cart & Wishlist Operations
  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    try {
      await api.addToCart(productId, quantity);
      await syncUserData();
      setShowCartDrawer(true);
    } catch (err) {
      alert('Could not add to cart. Please check availability.');
    }
  };

  const handleBuyNow = async (productId: string, quantity: number = 1) => {
    try {
      await api.addToCart(productId, quantity);
      await syncUserData();
      if (selectedProduct) setSelectedProduct(null);
      setShowCheckoutModal(true);
    } catch (err) {
      alert('Could not initiate checkout.');
    }
  };

  const handleUpdateCartQuantity = async (productId: string, quantity: number) => {
    await api.updateCartQuantity(productId, quantity);
    await syncUserData();
  };

  const handleRemoveFromCart = async (productId: string) => {
    await api.removeFromCart(productId);
    await syncUserData();
  };

  const handleClearCart = async () => {
    await api.clearCart();
    await syncUserData();
  };

  const handleToggleWishlist = async (productId: string) => {
    const isPresent = wishlist.some((item) => item.productId === productId);
    try {
      if (isPresent) {
        await api.removeFromWishlist(productId);
      } else {
        await api.addToWishlist(productId);
      }
      await syncUserData();
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    }
  };

  const handleOrderSuccess = () => {
    setShowCheckoutModal(false);
    setShowOrdersModal(true);
    syncUserData();
  };

  // Compute Cart & Wishlist counts
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalWishlistCount = wishlist.length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* 1. FIRST-LAUNCH REGISTRATION FLOW (MANDATORY ENFORCEMENT)                 */}
      {/* ========================================================================= */}
      {authView === 'register' && (
        <RegistrationModal
          onSuccess={handleRegistrationSuccess}
          onSwitchToLogin={() => setAuthView('login')}
        />
      )}

      {/* 2. OTP VERIFICATION FLOW (WITH ETHEREAL SANDBOX SECTION) */}
      {authView === 'otp' && (
        <OtpVerificationModal
          email={pendingEmail}
          onVerificationSuccess={handleVerificationSuccess}
          onOpenSandboxEmail={(email) => {
            setPendingEmail(email);
            setShowSandboxEmail(true);
          }}
        />
      )}

      {/* 3. ETHEREAL SANDBOX EMAIL MODAL */}
      {showSandboxEmail && (
        <SandboxEmailModal
          email={pendingEmail}
          onClose={() => setShowSandboxEmail(false)}
        />
      )}

      {/* 4. LOGIN MODAL */}
      {authView === 'login' && (
        <LoginModal
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setAuthView('register')}
          onRequiresVerification={(unverifiedEmail) => {
            setPendingEmail(unverifiedEmail);
            setAuthView('otp');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. MAIN PRITHIKA MART E-COMMERCE SHOPPING WEBSITE                         */}
      {/* ========================================================================= */}
      {authView === 'authenticated' && currentUser && (
        <>
          {/* Main Navigation Bar */}
          <Navbar
            user={currentUser}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(catSlug) => setSelectedCategory(catSlug)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={executeSearch}
            wishlistCount={totalWishlistCount}
            cartCount={totalCartCount}
            onOpenWishlist={() => setShowWishlistModal(true)}
            onOpenCart={() => setShowCartDrawer(true)}
            onOpenOrders={() => setShowOrdersModal(true)}
            onOpenSellerDashboard={() => setShowSellerDashboard(true)}
            onOpenAdminDashboard={() => setShowAdminDashboard(true)}
            onOpenCppArchitecture={() => setShowCppArchitecture(true)}
            onLogout={handleLogout}
          />

          {currentUser.role === 'seller' ? (
            /* ========================================================================= */
            /* SELLER VIEW: SELLER DASHBOARD (ONLY "ADD PRODUCT" BUTTON & CREATION FORM) */
            /* ========================================================================= */
            <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
              <SellerDashboard
                user={currentUser}
                onRefreshCatalog={executeSearch}
              />
            </main>
          ) : (
            /* ========================================================================= */
            /* BUYER VIEW: BUYER DASHBOARD (PRODUCTS ADDED BY SELLERS FROM POSTGRESQL)   */
            /* ========================================================================= */
            <>
              {/* Hero Promotional Banner Slider */}
              <BannerCarousel />

              {/* Main Marketplace Content */}
              <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
                {/* Filter & Sort Bar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Showing {products.length} Products
                    </span>
                    {selectedCategory !== 'all' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                        Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                      </span>
                    )}
                  </div>

                  {/* Sorting & Stock Filter */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>In Stock Only</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-semibold">Sort by:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                      >
                        <option value="featured">Featured Deals</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating">Highest Customer Rating</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Product Grid */}
                {loadingProducts ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-500 font-medium">Querying PostgreSQL product catalog...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto p-8">
                    <PackageX className="w-16 h-16 mx-auto text-amber-500/60 mb-3" />
                    <h3 className="text-base font-bold text-slate-900">Marketplace Catalog Ready</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      No active products listed in the catalog yet. When registered sellers add products to Prithika Mart, they will automatically appear here with their actual images and ₹ INR pricing.
                    </p>
                    {(selectedCategory !== 'all' || searchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('all');
                          setSearchQuery('');
                        }}
                        className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Reset Catalog Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {products.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        isWishlisted={wishlist.some((item) => item.productId === prod.id)}
                        onToggleWishlist={handleToggleWishlist}
                        onAddToCart={(id) => handleAddToCart(id, 1)}
                        onBuyNow={(id) => handleBuyNow(id, 1)}
                        onSelectProduct={(p) => setSelectedProduct(p)}
                      />
                    ))}
                  </div>
                )}
              </main>
            </>
          )}

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-12">
            <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 text-white font-black text-lg mb-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <span>Prithika<span className="text-amber-400">Mart</span></span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  India's authentic full-stack multi-seller marketplace built using high-performance C++20, Drogon Web Framework, and PostgreSQL.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 font-mono text-[11px]">
                  <span>Backend Engine: C++20 Drogon</span>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Customer Service</h4>
                <ul className="space-y-2 text-[11px]">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center & FAQ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Shipping & Delivery Rates</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Returns & Replacements</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security & OTP Assurance</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Sell with Us</h4>
                <ul className="space-y-2 text-[11px]">
                  <li>
                    <button
                      type="button"
                      onClick={() => setShowSellerDashboard(true)}
                      className="hover:text-white transition-colors text-left"
                    >
                      Merchant Central
                    </button>
                  </li>
                  <li><a href="#" className="hover:text-white transition-colors">Seller Registration Guide</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Fulfillment by Prithika Mart</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing & Commission</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">C++20 Architecture</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Equipped with OpenSSL CSPRNG OTP generation, PostgreSQL relational tables, and async epoll non-blocking event loop.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCppArchitecture(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-lg border border-emerald-500/30 text-[11px] transition-colors"
                >
                  View C++ & SQL Codebase
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800/80 py-4 text-center text-[11px] text-slate-500">
              &copy; {new Date().getFullYear()} Prithika Mart. All Rights Reserved. Capstone Project Architecture.
            </div>
          </footer>

          {/* ========================================================================= */}
          {/* MODALS & DRAWERS                                                          */}
          {/* ========================================================================= */}
          {/* Product Details Modal */}
          {selectedProduct && (
            <ProductDetailsModal
              product={selectedProduct}
              isWishlisted={wishlist.some((item) => item.productId === selectedProduct.id)}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onClose={() => setSelectedProduct(null)}
            />
          )}

          {/* Cart Drawer */}
          {showCartDrawer && (
            <CartDrawer
              cart={cart}
              summary={cartSummary}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveFromCart}
              onClearCart={handleClearCart}
              onProceedToCheckout={() => {
                setShowCartDrawer(false);
                setShowCheckoutModal(true);
              }}
              onClose={() => setShowCartDrawer(false)}
            />
          )}

          {/* Checkout Modal */}
          {showCheckoutModal && (
            <CheckoutModal
              cart={cart}
              summary={cartSummary}
              onOrderSuccess={handleOrderSuccess}
              onClose={() => setShowCheckoutModal(false)}
            />
          )}

          {/* Orders History Modal */}
          {showOrdersModal && (
            <OrdersModal onClose={() => setShowOrdersModal(false)} />
          )}

          {/* Wishlist Modal */}
          {showWishlistModal && (
            <WishlistModal
              wishlist={wishlist}
              onRemove={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onClose={() => setShowWishlistModal(false)}
            />
          )}

          {/* Seller Dashboard Modal */}
          {showSellerDashboard && (
            <SellerDashboard
              user={currentUser}
              isModal={true}
              onClose={() => setShowSellerDashboard(false)}
              onRefreshCatalog={executeSearch}
            />
          )}

          {/* Admin Dashboard Modal */}
          {showAdminDashboard && (
            <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
          )}

          {/* C++ Architecture Inspector */}
          {showCppArchitecture && (
            <CppArchitectureModal onClose={() => setShowCppArchitecture(false)} />
          )}
        </>
      )}
    </div>
  );
}
export default App;
