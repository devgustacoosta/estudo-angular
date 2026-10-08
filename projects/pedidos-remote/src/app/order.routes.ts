import { Routes } from '@angular/router';
import { ORDER_PROVIDERS } from './features/orders/infrastructure/http-order.adapter';
import { unsavedGuard } from './features/orders/presentation/unsaved.guard';
export const ORDER_ROUTES: Routes = [
  {
    path: '',
    providers: ORDER_PROVIDERS,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'historico' },
      {
        path: 'checkout',
        canDeactivate: [unsavedGuard],
        loadComponent: () =>
          import('./features/orders/presentation/checkout-page').then((m) => m.CheckoutPage),
      },
      {
        path: 'historico',
        loadComponent: () =>
          import('./features/orders/presentation/history-page').then((m) => m.HistoryPage),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/orders/presentation/detail-page').then((m) => m.DetailPage),
      },
    ],
  },
];
