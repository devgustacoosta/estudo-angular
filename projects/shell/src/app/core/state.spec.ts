import { TestBed } from '@angular/core/testing';
import { CartStore, Product, SessionStore } from 'portal-contracts';
import { FiltersStore } from '../features/catalog/presentation/filters.store';
const product: Product = {
  id: '1',
  name: 'Teclado',
  category: 'Acessórios',
  price: 2590,
  stock: 2,
  icon: '⌨',
};
describe('Estado compartilhado', () => {
  it('preserva a identidade root e calcula totais sem mutar snapshots', () => {
    const store = TestBed.inject(CartStore);
    expect(TestBed.inject(CartStore)).toBe(store);
    store.add(product);
    const previous = store.lines();
    store.add(product);
    expect(previous[0].quantity).toBe(1);
    expect(store.quantity()).toBe(2);
    expect(store.total()).toBe(5180);
    expect(() => store.add(product)).toThrow();
    store.clear();
    expect(store.total()).toBe(0);
  });
  it('impede quantidades inválidas e permite remover', () => {
    const store = new CartStore();
    expect(() => store.setQuantity(product, 1.5)).toThrow();
    store.add(product);
    store.setQuantity(product, 0);
    expect(store.lines()).toEqual([]);
  });
  it('BehaviorSubject entrega o filtro atual e atualiza com cópia', () => {
    const store = new FiltersStore();
    const values: unknown[] = [];
    const subscription = store.filters$.subscribe((value) => values.push(value));
    store.update({ q: 'mouse' });
    store.update({ q: 'mouse' });
    expect(values).toEqual([
      { q: '', category: '', page: 1 },
      { q: 'mouse', category: '', page: 1 },
    ]);
    let current;
    const second = store.filters$.subscribe((value) => (current = value));
    expect(current).toEqual(values[1]);
    subscription.unsubscribe();
    second.unsubscribe();
  });
  it('encerra a sessão explicitamente', () => {
    const store = new SessionStore();
    expect(store.session()).toBeNull();
  });
});
