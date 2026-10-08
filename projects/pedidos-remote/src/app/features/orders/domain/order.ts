export interface Buyer {
  name: string;
  email: string;
  address: string;
  postalCode: string;
  acceptTerms: boolean;
}
export interface OrderRequest {
  customer: Buyer;
  lines: { productId: string; quantity: number }[];
}
export interface PlacedOrder {
  id: string;
  total: number;
}
