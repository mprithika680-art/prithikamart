import React from 'react';
import { X, Heart, Trash2, ShoppingCart, ShoppingBag } from 'lucide-react';
import { WishlistItem } from '../types';

interface Props {
  wishlist: WishlistItem[];
  onRemove: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onClose: () => void;
}

export const WishlistModal: React.FC<Props> = ({ wishlist, onRemove, onAddToCart, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        id="wishlist-modal-window"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <h3 className="text-base font-black">Your Saved Wishlist ({wishlist.length})</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-3">
          {wishlist.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Heart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h4 className="font-bold text-slate-700 text-sm">Your wishlist is empty</h4>
              <p className="text-xs text-slate-400 mt-1">Tap the heart icon on any product to save it here.</p>
            </div>
          ) : (
            wishlist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl"
              >
                <img
                  src={item.product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
                  alt={item.product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="w-16 h-16 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h4>
                  <p className="text-xs font-black text-slate-900 mt-0.5">₹{item.product.price.toFixed(2)}</p>
                  <p className="text-[11px] text-slate-500">{item.product.category}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(item.productId);
                      onRemove(item.productId);
                    }}
                    className="py-1.5 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Move to Cart
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemove(item.productId)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
