import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL, SessionStore } from 'portal-contracts';
import {
  authorizationInterceptor,
  errorLoggingInterceptor,
  ErrorLog,
  refreshInterceptor,
} from './interceptors';
describe('Interceptors e refresh', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let store: SessionStore;
  const fresh = {
    token: 'new',
    refreshToken: 'r2',
    user: { id: '1', name: 'Ana', role: 'customer' as const },
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([errorLoggingInterceptor, authorizationInterceptor, refreshInterceptor]),
        ),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: 'http://localhost:3000/api' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    store = TestBed.inject(SessionStore);
    store.set({ ...fresh, token: 'old', refreshToken: 'r1' });
  });
  afterEach(() => http.verify());
  it('envia token somente à origem e caminho autorizados', () => {
    client.get('http://localhost:3000/api/orders').subscribe();
    const api = http.expectOne('http://localhost:3000/api/orders');
    expect(api.request.headers.get('Authorization')).toBe('Bearer old');
    api.flush([]);
    for (const url of [
      'https://external.local/api/orders',
      'http://localhost:3000/api-maliciosa',
      'http://localhost:3000/api/login',
    ]) {
      client.get(url).subscribe();
      const request = http.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({});
    }
  });
  it('faz uma renovação para dois 401 concorrentes e repete com token novo', () => {
    const results: unknown[] = [];
    client.get('http://localhost:3000/api/orders').subscribe((value) => results.push(value));
    client.get('http://localhost:3000/api/orders/1').subscribe((value) => results.push(value));
    http
      .expectOne('http://localhost:3000/api/orders')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne('http://localhost:3000/api/orders/1')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    const refresh = http.expectOne('http://localhost:3000/api/refresh');
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.body).toEqual({ refreshToken: 'r1' });
    refresh.flush(fresh);
    const retries = http.match((request) => request.url.includes('/orders'));
    expect(retries.length).toBe(2);
    retries.forEach((request) => {
      expect(request.request.headers.get('Authorization')).toBe('Bearer new');
      request.flush([]);
    });
    expect(results.length).toBe(2);
    expect(store.session()?.token).toBe('new');
    expect(TestBed.inject(ErrorLog).entries).toEqual([]);
  });
  it('não desloga no 403 e registra erro sem notificar duas vezes', () => {
    let status;
    client
      .get('http://localhost:3000/api/admin/orders')
      .subscribe({ error: (error) => (status = error.status) });
    http
      .expectOne('http://localhost:3000/api/admin/orders')
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(status).toBe(403);
    expect(store.session()).not.toBeNull();
    http.expectNone('http://localhost:3000/api/refresh');
    expect(TestBed.inject(ErrorLog).entries.length).toBe(1);
  });
  it('encerra sessão quando refresh é inválido sem criar loop', () => {
    client.get('http://localhost:3000/api/orders').subscribe({ error: () => {} });
    http
      .expectOne('http://localhost:3000/api/orders')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne('http://localhost:3000/api/refresh')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(store.session()).toBeNull();
    http.expectNone('http://localhost:3000/api/refresh');
  });
  it('não renova indefinidamente quando a tentativa repetida também dá 401', () => {
    client.get('http://localhost:3000/api/orders').subscribe({ error: () => {} });
    http
      .expectOne('http://localhost:3000/api/orders')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('http://localhost:3000/api/refresh').flush(fresh);
    http
      .expectOne('http://localhost:3000/api/orders')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectNone('http://localhost:3000/api/refresh');
  });
});

describe('Authorization com base relativa do proxy', () => {
  it('autoriza /api na origem atual e não envia token para outra origem', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authorizationInterceptor])),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    TestBed.inject(SessionStore).set({
      token: 'proxy-token',
      refreshToken: 'refresh',
      user: { id: 'cliente', name: 'Ana', role: 'customer' },
    });
    const client = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);
    client.get('/api/orders').subscribe();
    const local = http.expectOne('/api/orders');
    expect(local.request.headers.get('Authorization')).toBe('Bearer proxy-token');
    local.flush([]);
    client.get('https://api-terceira.example/api/orders').subscribe();
    const external = http.expectOne('https://api-terceira.example/api/orders');
    expect(external.request.headers.has('Authorization')).toBe(false);
    external.flush([]);
    http.verify();
  });
});
