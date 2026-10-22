import React, { useEffect, useState } from 'react';
import { X, Package, Clock, CheckCircle2, ChevronRight, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types';

interface Props {
  onClose: () => void;
}

export const OrdersModal: React.FC<Props> = ({ onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const res = await api.getOrders();
        if (res.orders) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        id="orders-history-modal"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black">Your Order History</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h4 className="font-bold text-slate-700 text-sm">No orders yet</h4>
              <p className="text-xs text-slate-400 mt-1">Once you check out, your orders will appear here.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Order ID</span>
                    <p className="text-xs font-mono font-bold text-slate-900">{order.id}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Placed On</span>
                    <p className="text-xs font-semibold text-slate-700">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Amount</span>
                    <p className="text-xs font-black text-slate-900">₹{order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100">
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
                        alt={item.productName}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                        }}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.productName}</p>
                        <p className="text-[11px] text-slate-500">
                          Qty: {item.quantity} &bull; ₹{item.price.toFixed(2)} each
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
