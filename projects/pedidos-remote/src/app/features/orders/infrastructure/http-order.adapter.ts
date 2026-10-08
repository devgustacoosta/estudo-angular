import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from 'portal-contracts';
import { OrderPort } from '../application/ports/order.port';
import { OrderRequest, PlacedOrder } from '../domain/order';
import { PlaceOrder } from '../application/place-order';
export const ORDER_PORT = new InjectionToken<OrderPort>('ORDER_PORT');
@Injectable()
export class HttpOrderAdapter implements OrderPort {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  place(request: OrderRequest): Promise<PlacedOrder> {
    return firstValueFrom(this.http.post<PlacedOrder>(`${this.api}/orders`, request));
  }
}
export const ORDER_PROVIDERS = [
  { provide: ORDER_PORT, useClass: HttpOrderAdapter },
  { provide: PlaceOrder, useFactory: () => new PlaceOrder(inject(ORDER_PORT)) },
];
