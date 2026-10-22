import React, { useState } from 'react';
import {
  Store,
  Plus,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface Props {
  user?: User | null;
  onRefreshCatalog?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

const CATEGORIES = [
  'Electronics',
  'Mobiles & Tablets',
  'Fashion & Apparel',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Books & Stationery',
  'Sports & Fitness',
  'Groceries & Gourmet',
];

export const SellerDashboard: React.FC<Props> = ({
  user,
  onRefreshCatalog,
  onClose,
  isModal = false,
}) => {
  // Toggle to show the product form
  const [showAddForm, setShowAddForm] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Image Preview Toggle & State
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setCategory(CATEGORIES[0]);
    setDescription('');
    setPrice('');
    setImageUrl('');
    setShowImagePreview(false);
    setImagePreviewError(false);
    setErrorMessage(null);
  };

  const handleOpenForm = () => {
    resetForm();
    setSuccessMessage(null);
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowAddForm(false);
  };

  const handleTogglePreview = () => {
    if (!imageUrl.trim()) {
      setErrorMessage('Please enter an Image URL first to preview it.');
      return;
    }
    setImagePreviewError(false);
    setShowImagePreview(!showImagePreview);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validate Product Name
    if (!name.trim()) {
      setErrorMessage('Product Name is required.');
      return;
    }

    // 2. Validate Category
    if (!category.trim()) {
      setErrorMessage('Category is required.');
      return;
    }

    // 3. Validate Description
    if (!description.trim()) {
      setErrorMessage('Description is required.');
      return;
    }

    // 4. Validate Price (₹ INR)
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMessage('Please enter a valid price in Indian Rupees (₹) greater than 0.');
      return;
    }

    // 5. Validate Image URL
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl) {
      setErrorMessage('Product Image URL is required.');
      return;
    }
    if (!trimmedUrl.match(/^https?:\/\/.+/i)) {
      setErrorMessage('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.addSellerProduct({
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: numPrice,
        imageUrl: trimmedUrl,
      });

      if (res.success) {
        // Success: Clear form, close form, show success message
        // CRITICAL: Do NOT display the added product on the Seller dashboard.
        resetForm();
        setShowAddForm(false);
        setSuccessMessage(
          `Product "${name.trim()}" was successfully saved to the PostgreSQL database! It is now live on the Buyer Dashboard.`
        );

        if (onRefreshCatalog) {
          onRefreshCatalog();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product to PostgreSQL database.');
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Seller Header / Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-400/20">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">Seller Dashboard</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Seller Role
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Prithika Mart Merchant Central &bull; {user ? user.fullName : 'Verified Merchant'}
              </p>
            </div>
          </div>

          {onClose && isModal && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Persistent Success Banner (after adding product) */}
      {successMessage && (
        <div
          id="seller-success-alert"
          className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3 shadow-sm animate-fadeIn"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-emerald-900">Product Published Successfully!</h4>
            <p className="text-emerald-700 mt-0.5 leading-relaxed">{successMessage}</p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              Note: As per requirements, product cards are hidden from the Seller dashboard and only visible to Buyers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dashboard Main Area */}
      {!showAddForm ? (
        /* Standalone Seller View: Display ONLY the "Add Product" button */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-14 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Plus className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Product Management
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Publish new merchandise directly to Prithika Mart. Products are instantly stored in the PostgreSQL database and made visible to all Buyers in the marketplace.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              id="seller-add-product-btn"
              onClick={handleOpenForm}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-400/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> PostgreSQL Backed
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Real-time Buyer Catalog Visibility
            </span>
            <span className="flex items-center gap-1.5">
              <Store className="w-4 h-4 text-indigo-500" /> Indian Rupees (₹ INR)
            </span>
          </div>
        </div>
      ) : (
        /* Product Form (Opened when Seller clicks "Add Product") */
        <div
          id="seller-product-form-card"
          className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 animate-fadeIn space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-500" /> Add New Product
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill in the details below to publish your merchandise to Prithika Mart.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMessage && (
            <div
              id="seller-form-error-alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleAddProduct} className="space-y-5">
            {/* 1. Product Name */}
            <div>
              <label htmlFor="product-name-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="product-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wireless Noise-Cancelling Headphones Pro"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* 2. Category & 4. Price (₹ INR) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-category-select" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="product-category-select"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all font-medium cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="product-price-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Price (₹ INR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    id="product-price-input"
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 1499"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 3. Description */}
            <div>
              <label htmlFor="product-description-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="product-description-input"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide specifications, key features, dimensions, and warranty details..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all font-normal leading-relaxed"
              />
            </div>

            {/* 5. Product Image URL & Preview Image Option */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="product-imageurl-input" className="block text-xs font-bold text-slate-700">
                  Product Image URL <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  id="preview-image-toggle-btn"
                  onClick={handleTogglePreview}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  {showImagePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showImagePreview ? 'Hide Preview' : 'Preview Image'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  id="product-imageurl-input"
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreviewError(false);
                  }}
                  placeholder="Paste direct image URL (e.g. https://images.unsplash.com/photo-...)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all font-mono"
                />
              </div>

              {/* Sample helper links */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                <span>Quick samples:</span>
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80');
                    setShowImagePreview(true);
                    setImagePreviewError(false);
                  }}
                  className="text-amber-600 hover:underline cursor-pointer"
                >
                  Headphones
                </button>
                &bull;
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80');
                    setShowImagePreview(true);
                    setImagePreviewError(false);
                  }}
                  className="text-amber-600 hover:underline cursor-pointer"
                >
                  Smartwatch
                </button>
                &bull;
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80');
                    setShowImagePreview(true);
                    setImagePreviewError(false);
                  }}
                  className="text-amber-600 hover:underline cursor-pointer"
                >
                  Analog Watch
                </button>
              </div>

              {/* Image Preview Window */}
              {showImagePreview && (
                <div
                  id="seller-image-preview-box"
                  className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4 animate-fadeIn"
                >
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center">
                    {imagePreviewError ? (
                      <div className="p-2 text-center text-rose-500 text-[10px]">
                        <AlertCircle className="w-6 h-6 mx-auto mb-1 text-rose-400" />
                        Failed to load image from URL
                      </div>
                    ) : (
                      <img
                        src={imageUrl.trim()}
                        alt="Product preview"
                        onError={() => setImagePreviewError(true)}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-slate-800 block">Image Preview</span>
                    <p className="text-slate-500 text-[11px] mt-0.5 break-all">
                      {imageUrl.trim() || 'No URL provided'}
                    </p>
                    {!imagePreviewError && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Image loaded successfully
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons: Add Product & Cancel */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                id="seller-cancel-product-btn"
                onClick={handleCancelForm}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                id="seller-submit-product-btn"
                disabled={submitting}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add Product</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  // If presented as a modal (e.g. from Admin or dropdown)
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col p-6 overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  // Full page view
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
      {content}
    </div>
  );
};
