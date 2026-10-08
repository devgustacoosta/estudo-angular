import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CartStore } from 'portal-contracts';
import { PlaceOrder } from '../application/place-order';
import { CheckoutPage } from './checkout-page';
const buyer = {
  name: 'Ana Silva',
  email: 'ana@demo.local',
  address: 'Rua Teste, 10',
  postalCode: '12345678',
  acceptTerms: true,
};
describe('Checkout reativo', () => {
  let execute: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    execute = vi.fn().mockResolvedValue({ id: 'o1', total: 1000 });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: PlaceOrder, useValue: { execute } }],
    });
  });
  it('não envia formulário inválido e apresenta feedback', () => {
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    fixture.componentInstance.submit.next();
    fixture.detectChanges();
    expect(fixture.componentInstance.form.invalid).toBe(true);
    expect(execute).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Revise os dados');
  });
  it('aceita formulário válido, ignora envios concorrentes e limpa carrinho', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const cart = TestBed.inject(CartStore);
    cart.add({ id: '1', name: 'Mouse', stock: 2, price: 1000, category: '', icon: '' });
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue(buyer);
    fixture.componentInstance.submit.next();
    fixture.componentInstance.submit.next();
    expect(execute).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(cart.quantity()).toBe(0);
    expect(navigate).toHaveBeenCalledWith(['/pedidos', 'o1'], { queryParams: { sucesso: '1' } });
  });
  it('CVA liga entrada nativa ao FormControl e marca touched', () => {
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#name');
    input.value = 'Ana Silva';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.form.controls.name.value).toBe('Ana Silva');
    expect(fixture.componentInstance.form.controls.name.touched).toBe(true);
  });
  it('pede confirmação para formulário alterado', async () => {
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.componentInstance.form.markAsDirty();
    const result = fixture.componentInstance.canLeave();
    expect(fixture.componentInstance.confirmOpen()).toBe(true);
    fixture.componentInstance.resolveLeave(false);
    await expect(result).resolves.toBe(false);
  });
});
