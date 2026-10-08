import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Order } from 'portal-contracts';
import { BrlPipe, StateComponent } from 'portal-ui';
import { OrdersQueryService } from '../infrastructure/orders-query.service';
@Component({
  imports: [RouterLink, DatePipe, BrlPipe, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Meus pedidos</h1>
    <p>Acompanhe suas compras em um só lugar.</p>
    @if (loading()) {
      <ui-state kind="loading">Carregando pedidos…</ui-state>
    }
    @if (error()) {
      <ui-state kind="error">{{ error() }}</ui-state
      ><button (click)="load()">Tentar novamente</button>
    }
    @for (order of orders(); track order.id) {
      <article class="panel order-row">
        <div>
          <h2>Pedido {{ order.id.slice(0, 8) }}</h2>
          <p>{{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }} • {{ order.status }}</p>
        </div>
        <strong>{{ order.total | brl }}</strong
        ><a [routerLink]="['/pedidos', order.id]">Ver detalhes</a>
      </article>
    }
    @if (!loading() && !error() && !orders().length) {
      <ui-state>Você ainda não fez pedidos.</ui-state
      ><a routerLink="/catalogo">Explorar catálogo</a>
    }`,
})
export class HistoryPage implements OnInit {
  private readonly query = inject(OrdersQueryService);
  private readonly destroy = inject(DestroyRef);
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.query
      .list()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe({
        next: (orders) => this.orders.set(orders),
        error: (error) =>
          this.error.set(error.error?.message ?? 'Não foi possível carregar os pedidos.'),
      });
  }
}
