import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, defer, exhaustMap, finalize, of } from 'rxjs';
import { CartStore } from 'portal-contracts';
import { BrlPipe, ConfirmComponent, FieldComponent, StateComponent } from 'portal-ui';
import { PlaceOrder } from '../application/place-order';
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BrlPipe,
    ConfirmComponent,
    FieldComponent,
    StateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Finalizar pedido</h1>
    <p>Confira seu carrinho e informe o endereço de entrega.</p>
    <div class="checkout-grid">
      <section class="panel">
        <h2>Dados de entrega</h2>
        <form [formGroup]="form" (ngSubmit)="submit.next()">
          <ui-field
            fieldId="name"
            label="Nome completo"
            autocomplete="name"
            formControlName="name"
            [error]="fieldError('name')"
          /><ui-field
            fieldId="buyer-email"
            label="E-mail"
            type="email"
            autocomplete="email"
            formControlName="email"
            [error]="fieldError('email')"
          /><ui-field
            fieldId="address"
            label="Endereço completo"
            autocomplete="street-address"
            formControlName="address"
            [error]="fieldError('address')"
          /><ui-field
            fieldId="postal"
            label="CEP (8 dígitos)"
            autocomplete="postal-code"
            formControlName="postalCode"
            [error]="fieldError('postalCode')"
          /><label class="checkbox"
            ><input type="checkbox" formControlName="acceptTerms" /> Aceito os termos de
            demonstração</label
          >
          @if (form.controls.acceptTerms.touched && form.controls.acceptTerms.invalid) {
            <small class="error">Aceite os termos para continuar.</small>
          }
          <button type="submit" [disabled]="busy() || !cart.quantity()">
            {{ busy() ? 'Finalizando…' : 'Finalizar pedido' }}
          </button>
        </form>
        @if (error()) {
          <ui-state kind="error">{{ error() }}</ui-state>
        }
      </section>
      <aside class="panel">
        <h2>Seu carrinho</h2>
        @for (line of cart.lines(); track line.product.id) {
          <div class="cart-row">
            <div>
              <strong>{{ line.product.name }}</strong>
              <p>{{ line.product.price | brl }}</p>
            </div>
            <label
              >Quantidade de {{ line.product.name
              }}<input
                type="number"
                min="0"
                [max]="line.product.stock"
                [value]="line.quantity"
                (change)="quantity(line.product, $event)" /></label
            ><button
              (click)="cart.setQuantity(line.product, 0)"
              [attr.aria-label]="'Remover ' + line.product.name"
            >
              Remover
            </button>
          </div>
        }
        @if (!cart.quantity()) {
          <ui-state>Seu carrinho está vazio.</ui-state
          ><a routerLink="/catalogo">Escolher produtos</a>
        }
        <div class="totals">
          <p>
            Subtotal <b>{{ cart.subtotal() | brl }}</b>
          </p>
          <p>Entrega <b>Grátis</b></p>
          <p>
            Total <b>{{ cart.total() | brl }}</b>
          </p>
        </div>
        <details>
          <summary>Diagnóstico de integração</summary>
          <p>
            Instância no remote: <code data-testid="remote-instance">{{ cart.instanceId }}</code>
          </p>
        </details>
      </aside>
    </div>
    <ui-confirm [open]="confirmOpen()" (decision)="resolveLeave($event)"
      ><p>
        Os dados do formulário serão descartados. O carrinho continuará disponível.
      </p></ui-confirm
    >`,
})
export class CheckoutPage {
  readonly cart = inject(CartStore);
  private readonly placeOrder = inject(PlaceOrder);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required, Validators.minLength(8)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    acceptTerms: [false, Validators.requiredTrue],
  });
  readonly busy = signal(false);
  readonly error = signal('');
  readonly confirmOpen = signal(false);
  readonly submit = new Subject<void>();
  private leaveResolver?: (value: boolean) => void;
  constructor() {
    this.destroy.onDestroy(() => {
      this.leaveResolver?.(false);
      this.submit.complete();
    });
    this.submit
      .pipe(
        exhaustMap(() => {
          this.form.markAllAsTouched();
          if (this.form.invalid) {
            this.error.set('Revise os dados de entrega.');
            return of(null);
          }
          this.busy.set(true);
          this.error.set('');
          const lines = this.cart.lines().map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            availableStock: line.product.stock,
          }));
          return defer(() => this.placeOrder.execute(this.form.getRawValue(), lines)).pipe(
            catchError((error) => {
              this.error.set(error.error?.message ?? error.message ?? 'Erro ao finalizar pedido.');
              return of(null);
            }),
            finalize(() => this.busy.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((order) => {
        if (order) {
          this.form.markAsPristine();
          this.cart.clear();
          void this.router.navigate(['/pedidos', order.id], { queryParams: { sucesso: '1' } });
        }
      });
  }
  fieldError(field: 'name' | 'email' | 'address' | 'postalCode'): string {
    const control = this.form.controls[field];
    return control.touched && control.invalid ? 'Informe um valor válido.' : '';
  }
  quantity(product: Parameters<CartStore['setQuantity']>[0], event: Event): void {
    try {
      this.cart.setQuantity(product, Number((event.target as HTMLInputElement).value));
      this.error.set('');
    } catch (error) {
      this.error.set((error as Error).message);
      (event.target as HTMLInputElement).value = String(
        this.cart.lines().find((line) => line.product.id === product.id)?.quantity ?? 0,
      );
    }
  }
  canLeave(): boolean | Promise<boolean> {
    if (this.busy()) return false;
    if (!this.form.dirty) return true;
    if (this.leaveResolver) return false;
    this.confirmOpen.set(true);
    return new Promise((resolve) => {
      this.leaveResolver = resolve;
    });
  }
  resolveLeave(value: boolean): void {
    this.confirmOpen.set(false);
    this.leaveResolver?.(value);
    this.leaveResolver = undefined;
  }
}
