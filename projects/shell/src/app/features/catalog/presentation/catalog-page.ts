import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { CartStore } from 'portal-contracts';
import { StateComponent } from 'portal-ui';
import { FiltersStore } from './filters.store';
import { CatalogService } from '../infrastructure/catalog.service';
import { FilterBar } from './filter-bar';
import { ProductCard } from './product-card';
@Component({
  imports: [FilterBar, ProductCard, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="page-heading">
      <div>
        <small>SEU PRÓXIMO SETUP</small>
        <h1>Catálogo</h1>
        <p>Equipamentos para trabalhar melhor.</p>
      </div>
      <span class="badge">{{ vm().total }} produtos</span>
    </div>
    <app-filter-bar />
    @if (vm().loading) {
      <ui-state kind="loading">Buscando produtos…</ui-state>
    }
    @if (vm().error) {
      <ui-state kind="error">{{ vm().error }}</ui-state
      ><button (click)="reload()">Tentar novamente</button>
    }
    @if (message()) {
      <ui-state [kind]="messageKind()">{{ message() }}</ui-state>
    }
    <div class="grid">
      @for (product of vm().items; track product.id) {
        <app-product-card [product]="product" (added)="add($event)" />
      }
    </div>
    @if (!vm().loading && !vm().error && !vm().items.length) {
      <ui-state>Nenhum produto encontrado.</ui-state>
    }
    <nav class="pagination" aria-label="Paginação">
      <button [disabled]="vm().page <= 1" (click)="page(-1)">Anterior</button
      ><span>Página {{ vm().page }} de {{ pages() }}</span
      ><button [disabled]="vm().page * 6 >= vm().total" (click)="page(1)">Próxima</button>
    </nav>`,
})
export class CatalogPage {
  readonly cart = inject(CartStore);
  private readonly filters = inject(FiltersStore);
  private readonly catalog = inject(CatalogService);
  readonly message = signal('');
  readonly messageKind = signal<'success' | 'error'>('success');
  private readonly retry = new Subject<void>();
  readonly vm = toSignal(
    combineLatest([this.filters.filters$, this.retry.pipe(startWith(undefined))]).pipe(
      switchMap(([filters]) => {
        return this.catalog.search(filters).pipe(
          map((result) => ({ ...result, page: filters.page, loading: false, error: '' })),
          catchError(() =>
            of({
              items: [],
              total: 0,
              page: filters.page,
              loading: false,
              error: 'Não foi possível carregar o catálogo.',
            }),
          ),
          startWith({ items: [], total: 0, page: filters.page, loading: true, error: '' }),
        );
      }),
    ),
    { initialValue: { items: [], total: 0, page: 1, loading: true, error: '' } },
  );
  pages(): number {
    return Math.max(1, Math.ceil(this.vm().total / 6));
  }
  page(delta: number): void {
    this.filters.update({ page: this.vm().page + delta });
  }
  reload(): void {
    this.retry.next();
  }
  add(product: Parameters<CartStore['add']>[0]): void {
    try {
      this.cart.add(product);
      this.messageKind.set('success');
      this.message.set(`${product.name} adicionado ao carrinho.`);
    } catch (error) {
      this.messageKind.set('error');
      this.message.set((error as Error).message);
    }
  }
}
