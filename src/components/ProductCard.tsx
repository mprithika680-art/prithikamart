import React, { useState } from 'react';
import { Heart, Star, ShoppingCart, Store, Zap, ImageOff } from 'lucide-react';
import { Product } from '../types';

interface Props {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onBuyNow: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

export const ProductCard: React.FC<Props> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
}) => {
  const [imgSrc, setImgSrc] = useState(product.imageUrl || FALLBACK_IMAGE);
  const [imgFailed, setImgFailed] = useState(false);

  const handleImageError = () => {
    if (!imgFailed) {
      setImgFailed(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
    >
      {/* Discount Badge */}
      {product.discountPercent > 0 && (
        <span className="absolute top-3 left-3 z-10 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
          {product.discountPercent}% OFF
        </span>
      )}

      {/* Wishlist Heart Button */}
      <button
        type="button"
        id={`wishlist-btn-${product.id}`}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist(product.id);
        }}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
          isWishlisted
            ? 'bg-rose-50 text-rose-600 shadow-sm'
            : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white'
        }`}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
      </button>

      {/* Product Image */}
      <div
        onClick={() => onSelectProduct(product)}
        className="relative aspect-square w-full overflow-hidden bg-slate-50 cursor-pointer flex items-center justify-center"
      >
        <img
          src={imgSrc}
          alt={product.name}
          onError={handleImageError}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute bottom-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
            Only {product.stock} left!
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Seller info */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-1">
            <span className="uppercase tracking-wider font-semibold text-slate-500">{product.category}</span>
            <div className="flex items-center gap-1 text-slate-500 truncate max-w-[130px]">
              <Store className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{product.sellerName || 'Verified Seller'}</span>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelectProduct(product)}
            className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
          >
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              <span>{product.rating || '5.0'}</span>
              <Star className="w-2.5 h-2.5 ml-0.5 fill-current" />
            </div>
            <span className="text-[11px] text-slate-400">({product.reviewCount || 0} reviews)</span>
          </div>

          {/* Price Block in Indian Rupees (₹ INR) */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-slate-900">
              ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
          <button
            type="button"
            id={`add-cart-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id);
            }}
            className="py-2 px-2.5 rounded-xl border border-slate-300 hover:border-slate-900 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          <button
            type="button"
            id={`buy-now-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(product.id);
            }}
            className="py-2 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
