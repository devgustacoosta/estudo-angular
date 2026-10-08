import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { BrlPipe, StateComponent } from 'portal-ui';
import { OrdersQueryService } from '../infrastructure/orders-query.service';
@Component({
  imports: [RouterLink, DatePipe, BrlPipe, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Detalhes do pedido</h1>
    @if (success) {
      <ui-state kind="success">Pedido finalizado com sucesso!</ui-state>
    }
    @if (vm().loading) {
      <ui-state kind="loading">Carregando detalhes…</ui-state>
    }
    @if (vm().error) {
      <ui-state kind="error">{{ vm().error }}</ui-state>
    }
    @if (vm().order; as order) {
      <section class="panel">
        <h2>Pedido {{ order.id.slice(0, 8) }}</h2>
        <p>{{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }} • {{ order.status }}</p>
        @for (line of order.lines; track line.productId) {
          <div class="order-row">
            <span>{{ line.name }} × {{ line.quantity }}</span
            ><strong>{{ line.price * line.quantity | brl }}</strong>
          </div>
        }
        <p class="total">Total: {{ order.total | brl }}</p>
        <h3>Entrega</h3>
        <p>
          {{ order.customer.name }} • {{ order.customer.address }} • CEP
          {{ order.customer.postalCode }}
        </p>
      </section>
    }
    <a routerLink="/pedidos/historico">Voltar ao histórico</a>`,
})
export class DetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly query = inject(OrdersQueryService);
  readonly success = this.route.snapshot.queryParamMap.has('sucesso');
  readonly vm = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) =>
        this.query.detail(params.get('id')!).pipe(
          map((order) => ({ order, loading: false, error: '' })),
          catchError((error) =>
            of({
              order: null,
              loading: false,
              error: error.error?.message ?? 'Pedido indisponível.',
            }),
          ),
          startWith({ order: null, loading: true, error: '' }),
        ),
      ),
    ),
    { initialValue: { order: null, loading: true, error: '' } },
  );
}
