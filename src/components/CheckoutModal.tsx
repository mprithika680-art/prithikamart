import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Truck, CreditCard, Banknote, MapPin, ArrowRight, Package } from 'lucide-react';
import { api } from '../services/api';
import { CartItem } from '../types';

interface Props {
  cart: CartItem[];
  summary: { subtotal: number; shippingFee: number; tax: number; total: number };
  onOrderSuccess: (orderId: string) => void;
  onClose: () => void;
}

export const CheckoutModal: React.FC<Props> = ({ cart, summary, onOrderSuccess, onClose }) => {
  const [fullName, setFullName] = useState('Prithika Sharma');
  const [street, setStreet] = useState('Flat 402, Sunshine Heights, M.G. Road');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [zipCode, setZipCode] = useState('400001');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  const [loading, setLoading] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.checkout({
        shippingAddress: {
          fullName,
          street,
          city,
          state,
          zipCode,
          phone,
        },
        paymentMethod,
      });

      if (res.success && res.orderId) {
        setConfirmedOrderId(res.orderId);
      }
    } catch (err: any) {
      alert(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        id="checkout-modal-window"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black tracking-tight">
              {confirmedOrderId ? 'Order Confirmed!' : 'Prithika Mart Express Checkout'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmed Screen */}
        {confirmedOrderId ? (
          <div className="p-8 text-center space-y-5 my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Thank You for Your Order!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your order has been recorded in the PostgreSQL database and forwarded to our merchants for immediate fulfillment.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Order Tracking ID:</span>
                <span className="font-mono font-bold text-indigo-600">{confirmedOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Total Paid / Payable:</span>
                <span className="font-bold text-slate-900">₹{summary.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Payment Option:</span>
                <span className="font-medium text-slate-800">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Estimated Delivery:</span>
                <span className="font-semibold text-emerald-600">Tomorrow by 4:00 PM</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                id="order-success-view-orders-btn"
                onClick={() => onOrderSuccess(confirmedOrderId)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Package className="w-4 h-4" /> View in Order History
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handlePlaceOrder} className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
            {/* Delivery Address Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">1. Delivery Address</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">State / Province</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Pincode / ZIP</label>
                  <input
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">2. Select Payment Method</h4>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 'Cash on Delivery', label: 'Cash on Delivery (Pay upon arrival)', icon: Banknote },
                  { id: 'UPI / Instant QR', label: 'UPI / Google Pay / PhonePe / Paytm', icon: CreditCard },
                  { id: 'Credit / Debit Card', label: 'Credit or Debit Card (Visa / Mastercard)', icon: CreditCard },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                        paymentMethod === item.id
                          ? 'bg-indigo-50/70 border-indigo-400 font-bold text-indigo-950'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === item.id}
                        onChange={() => setPaymentMethod(item.id)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Order Review Footer */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Items ({cart.length}):</span>
                <span>₹{summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Shipping:</span>
                <span>{summary.shippingFee === 0 ? 'FREE' : `₹${summary.shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-100 pt-2">
                <span>Order Total:</span>
                <span className="text-lg text-indigo-900">₹{summary.total.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                id="place-order-submit-btn"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs tracking-wide shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Processing Order...' : `Confirm & Place Order (₹${summary.total.toFixed(2)})`}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
