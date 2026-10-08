import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from 'portal-contracts';
import { HttpOrderAdapter } from './http-order.adapter';
describe('HttpOrderAdapter', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HttpOrderAdapter,
        { provide: API_URL, useValue: '/api' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  const request = {
    customer: {
      name: 'Ana Silva',
      email: 'a@b.com',
      address: 'Rua Teste 10',
      postalCode: '12345678',
      acceptTerms: true,
    },
    lines: [{ productId: '1', quantity: 1 }],
  };
  it('POST possui corpo explícito e resolve resultado após flush', async () => {
    const result = TestBed.inject(HttpOrderAdapter).place(request);
    const pending = http.expectOne('/api/orders');
    expect(pending.request.method).toBe('POST');
    expect(pending.request.body).toEqual(request);
    pending.flush({ id: '1', total: 1000 });
    await expect(result).resolves.toEqual({ id: '1', total: 1000 });
  });
  it('propaga conflito de estoque', async () => {
    const result = TestBed.inject(HttpOrderAdapter).place(request);
    const assertion = expect(result).rejects.toMatchObject({ status: 409 });
    http
      .expectOne('/api/orders')
      .flush({ message: 'Sem estoque' }, { status: 409, statusText: 'Conflict' });
    await assertion;
  });
});
