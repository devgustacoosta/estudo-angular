import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from 'portal-contracts';
import { OrdersQueryService } from './orders-query.service';
describe('OrdersQueryService HTTP', () => {
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
  it('escapa ID e consulta detalhe por GET', () => {
    let result;
    TestBed.inject(OrdersQueryService)
      .detail('pedido/1')
      .subscribe((value) => (result = value));
    const pending = http.expectOne('/api/orders/pedido%2F1');
    expect(pending.request.method).toBe('GET');
    pending.flush({ id: 'pedido/1', total: 1000 });
    expect(result).toEqual({ id: 'pedido/1', total: 1000 });
  });
  it('propaga detalhe inexistente 404', () => {
    let status;
    TestBed.inject(OrdersQueryService)
      .detail('missing')
      .subscribe({ error: (error) => (status = error.status) });
    http
      .expectOne('/api/orders/missing')
      .flush({ message: 'Pedido não encontrado.' }, { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
  });
});
