import { Injectable, computed, signal } from '@angular/core';
import { CartLine, Product } from './models';
@Injectable({ providedIn: 'root' })
export class CartStore {
  readonly instanceId = crypto.randomUUID();
  private readonly state = signal<readonly CartLine[]>([]);
  readonly lines = this.state.asReadonly();
  readonly quantity = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => sum + line.product.price * line.quantity, 0),
  );
  readonly total = computed(() => this.subtotal());
  add(product: Product): void {
    const current = this.lines().find((line) => line.product.id === product.id);
    this.setQuantity(product, (current?.quantity ?? 0) + 1);
  }
  setQuantity(product: Product, quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > product.stock)
      throw new Error('Quantidade excede o estoque disponível.');
    const others = this.lines().filter((line) => line.product.id !== product.id);
    this.state.set(quantity === 0 ? others : [...others, { product, quantity }]);
  }
  clear(): void {
    this.state.set([]);
  }
}
