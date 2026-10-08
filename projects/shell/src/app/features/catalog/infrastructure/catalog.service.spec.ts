import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from 'portal-contracts';
import { CatalogService } from './catalog.service';
describe('CatalogService HTTP', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('confere URL/método e entrega o resultado após flush', () => {
    let result;
    TestBed.inject(CatalogService)
      .search({ q: 'mouse', category: '', page: 2 })
      .subscribe((value) => (result = value));
    const request = http.expectOne('/api/products?q=mouse&category=&page=2');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], total: 12 });
    expect(result).toEqual({ items: [], total: 12 });
  });
  it('propaga erro 503', () => {
    let status = 0;
    TestBed.inject(CatalogService)
      .search({ q: '', category: '', page: 1 })
      .subscribe({ error: (error) => (status = error.status) });
    http
      .expectOne('/api/products?q=&category=&page=1')
      .flush({ message: 'Falha' }, { status: 503, statusText: 'Unavailable' });
    expect(status).toBe(503);
  });
});
