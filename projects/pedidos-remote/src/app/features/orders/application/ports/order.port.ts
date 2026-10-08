import { OrderRequest, PlacedOrder } from '../../domain/order';
export interface OrderPort {
  place(request: OrderRequest): Promise<PlacedOrder>;
}
