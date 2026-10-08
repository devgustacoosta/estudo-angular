import { OrderPort } from '../application/ports/order.port';
import { OrderRequest, PlacedOrder } from '../domain/order';
export class MemoryOrderAdapter implements OrderPort {
  readonly requests: OrderRequest[] = [];
  constructor(
    private readonly stock: Map<string, number>,
    private readonly prices = new Map<string, number>(),
  ) {}
  async place(request: OrderRequest): Promise<PlacedOrder> {
    for (const line of request.lines) {
      if (line.quantity > (this.stock.get(line.productId) ?? 0))
        throw new Error('Estoque insuficiente no servidor.');
    }
    request.lines.forEach((line) =>
      this.stock.set(line.productId, this.stock.get(line.productId)! - line.quantity),
    );
    this.requests.push(structuredClone(request));
    return {
      id: String(this.requests.length),
      total: request.lines.reduce(
        (total, line) => total + line.quantity * (this.prices.get(line.productId) ?? 0),
        0,
      ),
    };
  }
}
