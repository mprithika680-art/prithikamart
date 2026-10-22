export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  itemCount?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  category: string;
  categorySlug: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  rating: number;
  reviewCount: number;
  stock: number;
  imageUrl: string;
  images?: string[];
  features?: string[];
  brand: string;
  inStock: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  addedAt: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
}

export interface DeliveredEmailAudit {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  otpCode: string;
  sentAt: string;
  expiresAt: string;
  status: 'Delivered (Ethereal Sandbox)' | 'Expired' | 'Verified';
  rawHtml: string;
}
