import React, { useState } from 'react';
import { Eye, EyeOff, ShoppingBag, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api, setStoredToken } from '../services/api';
import { User } from '../types';

interface Props {
  onLoginSuccess: (user: User) => void;
  onSwitchToRegister: () => void;
  onRequiresVerification?: (email: string) => void;
}

export const LoginModal: React.FC<Props> = ({ onLoginSuccess, onSwitchToRegister, onRequiresVerification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.success && res.token && res.user) {
        setStoredToken(res.token);
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('not verified') && onRequiresVerification) {
        onRequiresVerification(email.trim().toLowerCase());
        return;
      }
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        id="prithika-login-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
      >
        {/* Brand Banner */}
        <div className="bg-slate-900 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 mb-2 border border-amber-500/30">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Prithika Mart</h1>
          <p className="text-xs text-slate-300 mt-0.5">Sign in to your account</p>
        </div>

        <div className="p-6 md:p-8">
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('For password reset, please use registration with real-time OTP verification.')}
                  className="text-[11px] text-indigo-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  id="login-toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="submit-login-btn"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs tracking-wide shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Evaluator Role Demo Shortcuts */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Evaluator Quick Access Credentials
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('seller@prithikamart.com', 'Seller@123')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:border-indigo-400 rounded-lg text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
              >
                Seller (Apex Official)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin@prithikamart.com', 'Admin@123')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:border-indigo-400 rounded-lg text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
              >
                Admin (Supermart)
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                id="login-switch-to-register-link"
                onClick={onSwitchToRegister}
                className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
