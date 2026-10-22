import React, { useState, useEffect } from 'react';
import { X, Star, Heart, ShoppingCart, Zap, Store, ShieldCheck, Truck, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { Product, Review } from '../types';
import { api } from '../services/api';

interface Props {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (id: string, quantity: number) => void;
  onBuyNow: (id: string, quantity: number) => void;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<Props> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onClose,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Review Form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      try {
        setLoadingReviews(true);
        const res = await api.getProductById(product.id);
        if (res.reviews) {
          setReviews(res.reviews);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    }
    loadReviews();
  }, [product.id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await api.createReview({
        productId: product.id,
        rating: newRating,
        title: newTitle.trim() || 'Great Purchase',
        comment: newComment.trim(),
      });

      if (res.success && res.review) {
        setReviews([res.review, ...reviews]);
        setReviewSuccess(true);
        setNewComment('');
        setNewTitle('');
        setTimeout(() => {
          setReviewSuccess(false);
          setShowReviewForm(false);
        }, 2000);
      }
    } catch (err) {
      alert('Failed to submit review. Please ensure you are logged in.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        id="product-details-modal"
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{product.category}</span>
            <span>&bull;</span>
            <span className="text-slate-700">SKU: {product.id}</span>
          </div>
          <button
            type="button"
            id="close-product-details-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Image Section */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 aspect-square">
              <img
                src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
                alt={product.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover object-center"
              />
              {product.discountPercent > 0 && (
                <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                  {product.discountPercent}% DISCOUNT
                </span>
              )}
            </div>

            {/* Right Product Overview */}
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {product.brand}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mt-1">
                  {product.name}
                </h1>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                    <span>{product.rating}</span>
                    <Star className="w-3 h-3 ml-1 fill-current" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {product.reviewCount} customer ratings
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900">₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-base text-slate-400 line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                  <span className="text-xs font-bold text-emerald-600">Inclusive of all taxes</span>
                </div>

                <div className="mt-2 text-xs font-medium text-slate-600 flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>
                    Sold by: <strong>{product.sellerName}</strong> ({product.sellerRating} / 5.0 Seller Rating)
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Stock Status */}
              <div>
                {product.inStock ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In Stock & ready to ship ({product.stock} units available)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    Currently Out of Stock
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700">Quantity:</span>
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  id="details-add-to-cart-btn"
                  onClick={() => onAddToCart(product.id, quantity)}
                  className="py-3 px-4 rounded-xl border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>

                <button
                  type="button"
                  id="details-buy-now-btn"
                  onClick={() => onBuyNow(product.id, quantity)}
                  className="py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Buy Now
                </button>
              </div>

              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className="w-full py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'text-rose-600 fill-rose-600' : 'text-slate-400'}`} />
                {isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
              </button>
            </div>
          </div>

          {/* Customer Reviews & Feedback Section */}
          <div className="border-t border-slate-200 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Customer Ratings & Reviews</h3>
                <p className="text-xs text-slate-500">Verified Prithika Mart Shopper Feedback</p>
              </div>

              <button
                type="button"
                id="open-write-review-btn"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {showReviewForm ? 'Close Review Form' : 'Write a Review'}
              </button>
            </div>

            {/* Write Review Form */}
            {showReviewForm && (
              <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-800">Share your experience with this product</h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Star Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">{newRating} of 5 Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Review Headline</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Excellent build quality & fast delivery"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Detailed Feedback</label>
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="How was the product performance, fit, and packaging?"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {reviewSuccess && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Review recorded successfully!
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            {/* Reviews List */}
            {loadingReviews ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-2xl">
                No customer reviews yet. Be the first to review this product!
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          <span>{r.rating}</span>
                          <Star className="w-2.5 h-2.5 ml-0.5 fill-current" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">{r.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{r.comment}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium">
                      <span>By {r.userName}</span>
                      {r.verifiedPurchase && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
