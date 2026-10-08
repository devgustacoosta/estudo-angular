import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Subject,
  catchError,
  concatMap,
  finalize,
  from,
  map,
  mergeMap,
  of,
  tap,
  toArray,
} from 'rxjs';
import { API_URL, Order } from 'portal-contracts';
import { BrlPipe, StateComponent, SelectOnFocusDirective } from 'portal-ui';
@Component({
  imports: [BrlPipe, StateComponent, SelectOnFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Administração</h1>
    <p>Indicadores calculados a partir dos pedidos da API.</p>
    @if (loading()) {
      <ui-state kind="loading">Carregando painel…</ui-state>
    }
    @if (error()) {
      <ui-state kind="error">{{ error() }}</ui-state>
    }
    @if (message()) {
      <ui-state kind="success">{{ message() }}</ui-state>
    }
    <div class="metrics">
      <article class="panel">
        <small>Pedidos</small><strong>{{ orders().length }}</strong>
      </article>
      <article class="panel">
        <small>Receita</small><strong>{{ revenue() | brl }}</strong>
      </article>
      <article class="panel">
        <small>Ticket médio</small><strong>{{ average() | brl }}</strong>
      </article>
    </div>
    <button (click)="load()">Atualizar painel</button>
    <h2>Operação dos pedidos</h2>
    @for (order of orders(); track order.id) {
      <div class="panel order-row">
        <span>{{ order.customer.name }} • {{ order.total | brl }} • {{ order.status }}</span
        ><button (click)="updates.next({ id: order.id, status: 'Em separação' })">Separar</button
        ><button (click)="updates.next({ id: order.id, status: 'Enviado' })">Enviar</button>
      </div>
    }
    @if (!orders().length && !loading()) {
      <ui-state>Nenhum pedido para administrar.</ui-state>
    }
    <section class="panel">
      <h2>Reposição independente</h2>
      <label for="stock">Novo estoque para os produtos 1, 2 e 3</label
      ><input id="stock" #stock type="number" min="0" value="20" selectOnFocus /><button
        [disabled]="restocking()"
        (click)="restock(stock.value)"
      >
        Repor três produtos
      </button>
      <p>São enviados até dois pedidos HTTP ao mesmo tempo.</p>
    </section>
    <section class="panel">
      <h2>Laboratório HTTP</h2>
      <label for="latency">Latência (ms, até 3000)</label
      ><input id="latency" #latency type="number" min="0" max="3000" value="180" /><label
        for="failures"
        >Próximas falhas 503 (até 10)</label
      ><input id="failures" #failures type="number" min="0" max="10" value="0" /><button
        (click)="configure(latency.value, failures.value)"
      >
        Aplicar simulação</button
      ><button (click)="expire()">Expirar meu token</button>
    </section>`,
})
export class AdminPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  private readonly destroy = inject(DestroyRef);
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly restocking = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly revenue = computed(() => this.orders().reduce((sum, order) => sum + order.total, 0));
  readonly average = computed(() =>
    this.orders().length ? this.revenue() / this.orders().length : 0,
  );
  readonly updates = new Subject<{ id: string; status: string }>();
  constructor() {
    this.updates
      .pipe(
        concatMap((update) =>
          this.http
            .patch<Order>(`${this.api}/admin/orders/${update.id}`, { status: update.status })
            .pipe(
              tap((order) => {
                this.orders.update((orders) =>
                  orders.map((item) => (item.id === order.id ? order : item)),
                );
                this.message.set('Status atualizado na ordem solicitada.');
              }),
              catchError((error) => {
                this.error.set(error.error?.message ?? 'Falha ao atualizar status.');
                return of(null);
              }),
            ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http
      .get<Order[]>(`${this.api}/admin/orders`)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe({
        next: (orders) => this.orders.set(orders),
        error: (error) => this.error.set(error.error?.message ?? 'Erro ao carregar painel.'),
      });
  }
  restock(value: string): void {
    const stock = Number(value);
    if (!Number.isInteger(stock) || stock < 0) {
      this.error.set('Estoque inválido.');
      return;
    }
    this.restocking.set(true);
    this.error.set('');
    from(['1', '2', '3'])
      .pipe(
        mergeMap(
          (id) =>
            this.http.patch(`${this.api}/admin/products/${id}`, { stock }).pipe(
              map(() => ({ id, ok: true })),
              catchError(() => of({ id, ok: false })),
            ),
          2,
        ),
        toArray(),
        finalize(() => this.restocking.set(false)),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((results) =>
        this.message.set(`${results.filter((result) => result.ok).length} de 3 produtos repostos.`),
      );
  }
  configure(latency: string, failures: string): void {
    this.action(
      '/demo/config',
      { latency: Number(latency), failures: Number(failures) },
      'Simulação configurada.',
    );
  }
  expire(): void {
    this.action('/demo/expire', {}, 'Token expirado. Atualize o painel para observar a renovação.');
  }
  private action(path: string, body: unknown, message: string): void {
    this.http
      .post(`${this.api}${path}`, body)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => this.message.set(message),
        error: (error) => this.error.set(error.error?.message ?? 'Falha na operação.'),
      });
  }
}
