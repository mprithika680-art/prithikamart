import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Heart,
  ShoppingCart,
  Package,
  User as UserIcon,
  LogOut,
  Store,
  Shield,
  Code2,
  MapPin,
  ChevronDown,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { User, Category } from '../types';

interface Props {
  user: User;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categorySlug: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  wishlistCount: number;
  cartCount: number;
  onOpenWishlist: () => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenSellerDashboard: () => void;
  onOpenAdminDashboard: () => void;
  onOpenCppArchitecture: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({
  user,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  wishlistCount,
  cartCount,
  onOpenWishlist,
  onOpenCart,
  onOpenOrders,
  onOpenSellerDashboard,
  onOpenAdminDashboard,
  onOpenCppArchitecture,
  onLogout,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  const isSeller = user.role === 'seller';
  const isAdmin = user.role === 'admin';

  // -------------------------------------------------------------
  // 1. SELLER NAVIGATION BAR
  // Streamlined merchant navigation: No buyer search or cart
  // -------------------------------------------------------------
  if (isSeller) {
    return (
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md">
        {/* Top utility strip */}
        <div className="border-b border-slate-800/80 bg-slate-950/60 px-4 py-1.5 text-[11px] text-slate-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold tracking-wide">Prithika Mart Seller Central</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Merchant Operations & Catalog Publishing</span>
            </div>

            <button
              type="button"
              onClick={onOpenCppArchitecture}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>C++20 Drogon Architecture</span>
            </button>
          </div>
        </div>

        {/* Main Seller Bar */}
        <div className="px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Brand Logo with Seller Central badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  Prithika<span className="text-amber-400">Mart</span>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                    Merchant Portal
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Seller Account &bull; {user.email}</div>
              </div>
            </div>

            {/* Seller Quick Info & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white">{user.fullName}</span>
                <span className="text-[10px] font-semibold text-emerald-400">Verified Marketplace Seller</span>
              </div>

              <button
                type="button"
                id="seller-logout-btn"
                onClick={onLogout}
                className="px-4 py-2 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer text-slate-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // -------------------------------------------------------------
  // 2. BUYER & ADMIN NAVIGATION BAR
  // Full consumer marketplace navigation with cart, search & wishlist
  // -------------------------------------------------------------
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md">
      {/* Top Bar / Utility strip */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 px-4 py-1.5 text-[11px] text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-amber-400 font-semibold tracking-wide">Prithika Mart Express</span>
            <span className="hidden sm:inline-block text-slate-500">|</span>
            <span className="hidden sm:inline-block text-slate-400">Next-Day Delivery to 19,000+ Pincodes across India</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              id="nav-cpp-architecture-btn"
              onClick={onOpenCppArchitecture}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>C++20 Drogon & PostgreSQL Architecture</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              id="brand-logo-btn"
              onClick={() => onSelectCategory('all')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                  Prithika<span className="text-amber-400">Mart</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium tracking-wide">Multi-Seller Marketplace</div>
              </div>
            </button>

            {/* Location selector */}
            <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <span className="block text-[10px] text-slate-400 leading-none">Deliver to</span>
                <span className="font-bold text-white text-xs">Mumbai 400001</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center">
            <div className="relative w-full flex items-center bg-white rounded-xl overflow-hidden shadow-inner border border-slate-300 focus-within:ring-2 focus-within:ring-amber-400">
              <select
                id="search-category-select"
                aria-label="Filter by category"
                value={selectedCategory}
                onChange={(e) => onSelectCategory(e.target.value)}
                className="bg-slate-100 border-r border-slate-300 text-slate-700 text-xs font-semibold py-2.5 px-3 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                id="main-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, brands, and sellers..."
                className="w-full px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />

              <button
                type="button"
                id="main-search-submit-btn"
                onClick={onSearchSubmit}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 py-2.5 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Icons & User Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Wishlist Button */}
            <button
              type="button"
              id="nav-wishlist-btn"
              onClick={onOpenWishlist}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Orders Button */}
            <button
              type="button"
              id="nav-orders-btn"
              onClick={onOpenOrders}
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4 text-amber-400" />
              <span>Orders</span>
            </button>

            {/* Cart Button */}
            <button
              type="button"
              id="nav-cart-btn"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-[11px] font-black flex items-center justify-center">
                {cartCount}
              </span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="nav-user-menu-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-800 text-left transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {user.fullName.charAt(0)}
                </div>
                <div className="hidden lg:block">
                  <span className="block text-[10px] text-slate-400 leading-none">Hello, {user.fullName.split(' ')[0]}</span>
                  <span className="text-xs font-bold text-white capitalize flex items-center gap-1">
                    {user.role} <ChevronDown className="w-3 h-3 text-slate-400" />
                  </span>
                </div>
              </button>

              {showUserDropdown && (
                <div
                  id="user-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 text-slate-800 text-xs z-50 animate-fadeIn"
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Role: {user.role}
                    </span>
                  </div>

                  <div className="py-1">
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          id="dropdown-admin-dashboard-btn"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenAdminDashboard();
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 font-semibold text-rose-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-rose-500" />
                          Admin Console
                        </button>
                        <button
                          type="button"
                          id="dropdown-seller-dashboard-btn"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenSellerDashboard();
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 font-semibold text-amber-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-amber-500" />
                          Seller Dashboard
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenOrders();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      Order History
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenWishlist();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-slate-400" />
                      Saved Wishlist ({wishlistCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenCppArchitecture();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 font-medium text-emerald-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Code2 className="w-4 h-4 text-emerald-500" />
                      C++ Drogon Architecture
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      id="logout-btn"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-rose-50 font-semibold text-rose-600 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 md:hidden text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-inner">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products, brands, sellers..."
              className="w-full px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={onSearchSubmit}
              className="bg-amber-400 text-slate-950 px-4 py-2"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Navigation Ribbon */}
      <nav className="bg-slate-800/95 border-t border-slate-700/60 px-4 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-2 py-2 text-xs whitespace-nowrap">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            All Products
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};
