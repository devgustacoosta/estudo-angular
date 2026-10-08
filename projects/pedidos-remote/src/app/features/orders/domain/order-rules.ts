export interface RequestedLine {
  productId: string;
  quantity: number;
  availableStock: number;
}
export class StockError extends Error {}
export function validateLines(lines: readonly RequestedLine[]): void {
  if (!lines.length) throw new StockError('O carrinho está vazio.');
  const ids = new Set<string>();
  for (const line of lines) {
    if (ids.has(line.productId)) throw new StockError('Produto duplicado.');
    ids.add(line.productId);
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > line.availableStock
    )
      throw new StockError('Quantidade ou estoque inválido.');
  }
}
