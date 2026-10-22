import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export const BannerCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      title: 'Prithika Super Mega Sale',
      subtitle: 'Up to 70% Off on Top Electronics, Smartphones & Smart Wearables',
      tag: 'C++20 DROGON HIGH CONCURRENCY EVENT',
      bgGradient: 'from-indigo-950 via-slate-900 to-amber-950',
      accentColor: 'text-amber-400',
      badge: 'Limited Time Deal',
    },
    {
      id: 2,
      title: 'Direct Multi-Seller Marketplace',
      subtitle: 'Shop directly from verified Indian merchants with guaranteed quality & instant dispatch',
      tag: '100% VERIFIED SELLERS',
      bgGradient: 'from-emerald-950 via-slate-900 to-slate-950',
      accentColor: 'text-emerald-400',
      badge: 'Certified Genuine',
    },
    {
      id: 3,
      title: 'Zero-Fraud Shopping Guarantee',
      subtitle: 'Cryptographic SHA-256 Auth, Real-Time Email OTP Verification & Secure Checkout',
      tag: 'SECURITY FIRST',
      bgGradient: 'from-blue-950 via-slate-900 to-purple-950',
      accentColor: 'text-sky-400',
      badge: 'OpenSSL Powered',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200/40">
        <div
          className={`relative p-8 md:p-12 text-white bg-gradient-to-r ${banners[currentSlide].bgGradient} transition-all duration-700 min-h-[220px] md:min-h-[260px] flex flex-col justify-center`}
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 backdrop-blur-sm border border-white/20 mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{banners[currentSlide].badge}</span>
              <span className="text-white/40">&bull;</span>
              <span className="text-amber-300">{banners[currentSlide].tag}</span>
            </div>

            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-2 leading-tight">
              {banners[currentSlide].title}
            </h2>

            <p className="text-xs md:text-sm text-slate-300 font-medium max-w-xl mb-6">
              {banners[currentSlide].subtitle}
            </p>
          </div>

          {/* Carousel dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? 'w-8 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Prev/Next arrows */}
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Badges Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 bg-white border-t border-slate-200 divide-x divide-slate-100 text-xs text-slate-700 py-3 px-4">
          <div className="flex items-center gap-2.5 p-2">
            <Truck className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-[11px] leading-tight font-bold text-slate-900">Free Fast Delivery</p>
              <p className="text-[10px] text-slate-400">On all orders above ₹499</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-[11px] leading-tight">100% Genuine Guarantee</p>
              <p className="text-[10px] text-slate-400">Directly from verified sellers</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2">
            <RefreshCw className="w-5 h-5 text-sky-500 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-[11px] leading-tight">7-Day Easy Returns</p>
              <p className="text-[10px] text-slate-400">Hassle-free refund policy</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2">
            <Zap className="w-5 h-5 text-purple-500 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-[11px] leading-tight">C++20 Sub-Millisecond Speed</p>
              <p className="text-[10px] text-slate-400">Epoll async event loop</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
