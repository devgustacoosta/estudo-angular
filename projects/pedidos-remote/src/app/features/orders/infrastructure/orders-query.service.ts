import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL, Order } from 'portal-contracts';
@Injectable({ providedIn: 'root' })
export class OrdersQueryService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  list() {
    return this.http.get<Order[]>(`${this.api}/orders`);
  }
  detail(id: string) {
    return this.http.get<Order>(`${this.api}/orders/${encodeURIComponent(id)}`);
  }
}
