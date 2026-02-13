
export type ProductType = 'facebook' | 'proxy' | 'tiktok' | 'email';

export interface Product {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  price: number;
  originalPrice: number;
  features: string[];
  image: string;
  stock: number;
  rating: number;
  badge?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string; // Added for Google Login visual
  role: 'user' | 'admin';
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'completed' | 'pending';
  downloadUrl?: string;
  credentials?: string[]; // Campo novo: Lista de credenciais entregues
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
