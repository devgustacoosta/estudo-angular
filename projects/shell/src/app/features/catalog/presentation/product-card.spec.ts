import { TestBed } from '@angular/core/testing';
import { ProductCard } from './product-card';
const product = {
  id: '1',
  name: 'Mouse',
  price: 10000,
  category: 'Acessórios',
  stock: 2,
  icon: '◉',
};
describe('ProductCard input/output', () => {
  it('reage ao input em ngOnChanges e emite o produto sem alterar input', () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('2 em estoque');
    const added: unknown[] = [];
    fixture.componentInstance.added.subscribe((value) => added.push(value));
    fixture.nativeElement.querySelector('button').click();
    expect(added).toEqual([product]);
    expect(fixture.componentInstance.availability).toBe('2 em estoque');
    fixture.componentRef.setInput('product', { ...product, stock: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Indisponível');
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
  });
});
