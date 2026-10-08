import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL, ProductPage } from 'portal-contracts';
import { CatalogFilters } from '../presentation/filters.store';
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  search(filters: CatalogFilters) {
    return this.http.get<ProductPage>(`${this.api}/products`, { params: { ...filters } });
  }
}
