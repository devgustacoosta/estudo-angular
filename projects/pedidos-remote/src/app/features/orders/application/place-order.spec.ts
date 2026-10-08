import { PlaceOrder } from './place-order';
import { MemoryOrderAdapter } from '../infrastructure/memory-order.adapter';
import { validateLines } from '../domain/order-rules';
const buyer = {
  name: 'Ana Silva',
  email: 'ana@demo.local',
  address: 'Rua Teste, 10',
  postalCode: '12345678',
  acceptTerms: true,
};
describe('Caso de uso e regra de estoque sem Angular/HTTP', () => {
  it('finaliza via porta, desconta estoque e não envia availableStock', async () => {
    const stock = new Map([['1', 2]]);
    const adapter = new MemoryOrderAdapter(stock, new Map([['1', 1000]]));
    const result = await new PlaceOrder(adapter).execute(buyer, [
      { productId: '1', quantity: 2, availableStock: 2 },
    ]);
    expect(result.total).toBe(2000);
    expect(stock.get('1')).toBe(0);
    expect(adapter.requests[0].lines).toEqual([{ productId: '1', quantity: 2 }]);
  });
  it('servidor rejeita estoque que mudou após o catálogo', async () => {
    const adapter = new MemoryOrderAdapter(new Map([['1', 1]]));
    await expect(
      new PlaceOrder(adapter).execute(buyer, [{ productId: '1', quantity: 2, availableStock: 5 }]),
    ).rejects.toThrow('Estoque insuficiente');
    expect(adapter.requests).toHaveLength(0);
  });
  it('rejeita vazio, fração, zero, duplicata e quantidade maior que estoque', () => {
    expect(() => validateLines([])).toThrow();
    for (const quantity of [0, -1, 1.5, 3])
      expect(() => validateLines([{ productId: '1', quantity, availableStock: 2 }])).toThrow();
    expect(() =>
      validateLines([
        { productId: '1', quantity: 1, availableStock: 2 },
        { productId: '1', quantity: 1, availableStock: 2 },
      ]),
    ).toThrow();
  });
  it('não chama adapter com comprador inválido', async () => {
    const adapter = new MemoryOrderAdapter(new Map([['1', 2]]));
    await expect(
      new PlaceOrder(adapter).execute({ ...buyer, acceptTerms: false }, [
        { productId: '1', quantity: 1, availableStock: 2 },
      ]),
    ).rejects.toThrow();
    expect(adapter.requests).toHaveLength(0);
  });
});
