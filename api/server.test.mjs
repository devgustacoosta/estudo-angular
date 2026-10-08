import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from './server.mjs';
let server, base;
before(async () => {
  server = createApi().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => new Promise((resolve) => server.close(resolve)));
async function call(path, token, method = 'GET', body) {
  return fetch(base + path, {
    method,
    signal: AbortSignal.timeout(5000),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function login(profile) {
  return (
    await call('/login', null, 'POST', { email: `${profile}@demo.local`, password: 'demo123' })
  ).json();
}
const customer = {
  name: 'Ana Silva',
  email: 'ana@demo.local',
  address: 'Rua Teste, 10',
  postalCode: '12345678',
  acceptTerms: true,
};
test('401 sem sessão; 403 com perfil cliente; refresh rotaciona token', async () => {
  assert.equal((await call('/orders')).status, 401);
  const session = await login('cliente');
  assert.equal((await call('/admin/orders', session.token)).status, 403);
  const renewed = await (
    await call('/refresh', null, 'POST', { refreshToken: session.refreshToken })
  ).json();
  assert.ok(renewed.token);
  assert.notEqual(renewed.token, session.token);
  assert.equal(
    (await call('/refresh', null, 'POST', { refreshToken: session.refreshToken })).status,
    401,
  );
});
test('pedidos concorrentes não vendem acima do estoque; preço vem do servidor', async () => {
  const admin = await login('admin');
  await call('/demo/config', admin.token, 'POST', { latency: 0, failures: 0 });
  await call('/admin/products/1', admin.token, 'PATCH', { stock: 2 });
  const user = await login('cliente');
  const body = { customer, lines: [{ productId: '1', quantity: 2, price: 1 }] };
  const responses = await Promise.all([
    call('/orders', user.token, 'POST', body),
    call('/orders', user.token, 'POST', body),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  const placed = await responses.find((r) => r.status === 201).json();
  assert.equal(placed.total, 5180);
  const catalog = await (await call('/products')).json();
  assert.equal(catalog.items[0].stock, 0);
  assert.equal((await call(`/orders/${placed.id}`, admin.token)).status, 200);
  const invalid = await call('/orders', user.token, 'POST', {
    customer,
    lines: [{ productId: '2', quantity: 0 }],
  });
  assert.equal(invalid.status, 400);
});
test('falha após validação não desconta parcialmente; agrega duplicatas', async () => {
  const admin = await login('admin');
  await call('/admin/products/2', admin.token, 'PATCH', { stock: 4 });
  const user = await login('cliente');
  assert.equal(
    (
      await call('/orders', user.token, 'POST', {
        customer,
        lines: [
          { productId: '2', quantity: 1 },
          { productId: '1', quantity: 1 },
        ],
      })
    ).status,
    409,
  );
  const products = await (await call('/products')).json();
  assert.equal(products.items[1].stock, 4);
  assert.equal(
    (
      await call('/orders', user.token, 'POST', {
        customer,
        lines: [
          { productId: '2', quantity: 3 },
          { productId: '2', quantity: 3 },
        ],
      })
    ).status,
    409,
  );
});
test('expiração gera 401; simulação controlada gera 503 e se recupera', async () => {
  const admin = await login('admin');
  await call('/demo/expire', admin.token, 'POST', {});
  assert.equal((await call('/admin/orders', admin.token)).status, 401);
  const fresh = await (
    await call('/refresh', null, 'POST', { refreshToken: admin.refreshToken })
  ).json();
  await call('/demo/config', fresh.token, 'POST', { latency: 0, failures: 1 });
  assert.equal((await call('/products')).status, 503);
  assert.equal((await call('/products')).status, 200);
});
