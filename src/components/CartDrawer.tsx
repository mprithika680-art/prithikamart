import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { CartItem } from '../types';

interface Props {
  cart: CartItem[];
  summary: { subtotal: number; shippingFee: number; tax: number; total: number };
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onClose: () => void;
}

export const CartDrawer: React.FC<Props> = ({
  cart,
  summary,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div
        id="cart-drawer-panel"
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slideLeft"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-base">Your Shopping Cart</h3>
            <span className="text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>
          <button
            type="button"
            id="close-cart-drawer-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <Truck className="w-4 h-4 text-amber-700" />
            {summary.subtotal >= 499 ? (
              <span className="font-bold text-emerald-800">You qualify for FREE Delivery!</span>
            ) : (
              <span>Add ₹{(499 - summary.subtotal).toFixed(2)} more for FREE Delivery</span>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">Your cart is empty</p>
              <p className="text-xs text-slate-400 mt-1">Explore trending deals and fill your basket!</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl"
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
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    ₹{item.product.price.toFixed(2)} each
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 font-bold text-slate-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.productId)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Price Breakdown Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">₹{summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{summary.shippingFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${summary.shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8%):</span>
                <span>₹{summary.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-base text-indigo-950">₹{summary.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              id="proceed-to-checkout-btn"
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs tracking-wide shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> 256-Bit Encrypted
              </span>
              <button
                type="button"
                onClick={onClearCart}
                className="text-[11px] text-slate-500 hover:text-rose-600 underline"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
