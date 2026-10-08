import { Buyer, PlacedOrder } from '../domain/order';
import { RequestedLine, validateLines } from '../domain/order-rules';
import { OrderPort } from './ports/order.port';
export class PlaceOrder {
  constructor(private readonly orders: OrderPort) {}
  async execute(customer: Buyer, lines: readonly RequestedLine[]): Promise<PlacedOrder> {
    validateLines(lines);
    if (customer.name.trim().length < 3 || !customer.acceptTerms)
      throw new Error('Preencha os dados e aceite os termos.');
    return this.orders.place({
      customer: { ...customer },
      lines: lines.map(({ productId, quantity }) => ({ productId, quantity })),
    });
  }
}
