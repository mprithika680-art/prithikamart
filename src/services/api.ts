import { Product, Category, CartItem, WishlistItem, Order, Review, User, DeliveredEmailAudit } from '../types';

const TOKEN_KEY = 'prithika_mart_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'An unexpected error occurred.');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { fullName: string; email: string; password: string; confirmPassword: string; role: string }) =>
    request<{ success: boolean; message: string; email: string; expiresInSeconds: number }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyOtp: (payload: { email: string; otp: string }) =>
    request<{ success: boolean; message: string; token: string; user: User }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resendOtp: (email: string) =>
    request<{ success: boolean; message: string; expiresInSeconds: number }>('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ success: boolean; message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  logout: () =>
    request<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  // Sandbox emails
  getDeliveredEmails: (email?: string) => {
    const url = email ? `/api/sandbox/delivered-emails?email=${encodeURIComponent(email)}` : '/api/sandbox/delivered-emails';
    return request<{ emails: DeliveredEmailAudit[] }>(url);
  },

  getLatestDeliveredEmail: (email?: string) => {
    const url = email ? `/api/sandbox/delivered-emails/latest?email=${encodeURIComponent(email)}` : '/api/sandbox/delivered-emails/latest';
    return request<{ email: DeliveredEmailAudit }>(url);
  },

  // Products & Categories
  getCategories: () => request<{ categories: Category[] }>('/api/categories'),

  getProducts: () => request<{ products: Product[] }>('/api/products'),

  searchProducts: (params: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    inStock?: boolean;
    sortBy?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.category) searchParams.set('category', params.category);
    if (params.minPrice !== undefined) searchParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) searchParams.set('maxPrice', params.maxPrice.toString());
    if (params.rating !== undefined) searchParams.set('rating', params.rating.toString());
    if (params.inStock) searchParams.set('inStock', 'true');
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);

    return request<{ products: Product[]; count: number }>(`/api/products/search?${searchParams.toString()}`);
  },

  getProductById: (id: string) => request<{ product: Product; reviews: Review[] }>(`/api/products/${id}`),

  // Wishlist
  getWishlist: () => request<{ wishlist: WishlistItem[] }>('/api/wishlist'),
  addToWishlist: (productId: string) =>
    request<{ success: boolean; message: string }>('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),
  removeFromWishlist: (productId: string) =>
    request<{ success: boolean; removed: boolean }>(`/api/wishlist/${productId}`, {
      method: 'DELETE',
    }),

  // Cart
  getCart: () =>
    request<{
      cart: CartItem[];
      summary: { subtotal: number; shippingFee: number; tax: number; total: number };
    }>('/api/cart'),
  addToCart: (productId: string, quantity: number = 1) =>
    request<{ success: boolean; message: string; cartItem: any }>('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  updateCartQuantity: (productId: string, quantity: number) =>
    request<{ success: boolean; message: string }>(`/api/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  removeFromCart: (productId: string) =>
    request<{ success: boolean; message: string }>(`/api/cart/${productId}`, {
      method: 'DELETE',
    }),
  clearCart: () =>
    request<{ success: boolean; message: string }>('/api/cart', {
      method: 'DELETE',
    }),

  // Checkout & Orders
  checkout: (payload: {
    shippingAddress: {
      fullName: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      phone: string;
    };
    paymentMethod: string;
  }) =>
    request<{ success: boolean; message: string; orderId: string; order: Order }>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getOrders: () => request<{ orders: Order[] }>('/api/orders'),

  // Seller
  getSellerProducts: () => request<{ products: Product[] }>('/api/seller/products'),
  addSellerProduct: (payload: Partial<Product>) =>
    request<{ success: boolean; product: Product }>('/api/seller/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateSellerProduct: (id: string, payload: Partial<Product>) =>
    request<{ success: boolean; product: Product }>(`/api/seller/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteSellerProduct: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/seller/products/${id}`, {
      method: 'DELETE',
    }),
  getSellerOrders: () => request<{ orders: Order[] }>('/api/seller/orders'),
  updateOrderStatus: (orderId: string, status: string) =>
    request<{ success: boolean; order: Order }>(`/api/seller/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Admin
  getAdminStats: () =>
    request<{
      stats: {
        totalUsers: number;
        totalProducts: number;
        totalOrders: number;
        totalRevenue: number;
        totalBuyers: number;
        totalSellers: number;
      };
    }>('/api/admin/stats'),
  getAdminUsers: () => request<{ users: User[] }>('/api/admin/users'),
  deleteAdminUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }),

  // Reviews
  createReview: (payload: { productId: string; rating: number; title: string; comment: string }) =>
    request<{ success: boolean; review: Review }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
