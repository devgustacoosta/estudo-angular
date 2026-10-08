export interface Product {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly price: number;
  readonly stock: number;
  readonly icon: string;
}
export interface CartLine {
  readonly product: Product;
  readonly quantity: number;
}
export interface Customer {
  name: string;
  email: string;
  address: string;
  postalCode: string;
  acceptTerms: boolean;
}
export interface OrderLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}
export interface Order {
  id: string;
  userId: string;
  createdAt: string;
  status: string;
  customer: Customer;
  lines: OrderLine[];
  total: number;
}
export interface User {
  id: string;
  name: string;
  role: 'customer' | 'admin';
}
export interface Session {
  token: string;
  refreshToken: string;
  user: User;
}
export interface ProductPage {
  items: Product[];
  total: number;
}
