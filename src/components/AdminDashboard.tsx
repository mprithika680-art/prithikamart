import React, { useEffect, useState } from 'react';
import { X, Shield, Users, ShoppingBag, DollarSign, Package, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface Props {
  onClose: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onClose }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalBuyers: 0,
    totalSellers: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [sRes, uRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
      ]);
      if (sRes.stats) setStats(sRes.stats);
      if (uRes.users) setUsers(uRes.users);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to revoke this user account?')) {
      await api.deleteAdminUser(userId);
      await loadAdminData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        id="admin-dashboard-modal"
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-base font-black">Prithika Mart Admin Console</h3>
              <p className="text-[11px] text-slate-400">Platform Supervision & PostgreSQL Integrity</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Registered Users</span>
            <span className="text-xl font-black text-slate-900">{stats.totalUsers}</span>
            <p className="text-[10px] text-slate-400 mt-1">
              {stats.totalBuyers} Buyers &bull; {stats.totalSellers} Sellers
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Live Catalog SKUs</span>
            <span className="text-xl font-black text-indigo-600">{stats.totalProducts}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Marketplace Orders</span>
            <span className="text-xl font-black text-amber-600">{stats.totalOrders}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Platform Revenue</span>
            <span className="text-xl font-black text-emerald-600">₹{stats.totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* User Accounts Management */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900">User Account & Role Directory</h4>
            <span className="text-xs text-slate-500 font-medium">PostgreSQL users table</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">OTP Verified</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3 text-right">Supervision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{u.fullName}</td>
                    <td className="p-3 font-mono text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : u.role === 'seller'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.isVerified ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Pending OTP</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Revoke User Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
