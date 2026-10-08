import { test, expect } from '@playwright/test';

test.beforeAll(async ({ request }) => {
  await expect
    .poll(async () => (await request.get('http://localhost:4200/api/health')).status(), {
      timeout: 60000,
    })
    .toBe(200);
  await expect
    .poll(
      async () => (await request.get('http://localhost:4200/remote/remoteEntry.json')).status(),
      { timeout: 60000 },
    )
    .toBe(200);
});
async function login(page: import('@playwright/test').Page, profile = 'cliente') {
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill(`${profile}@demo.local`);
  await page.getByLabel('Senha', { exact: true }).fill('demo123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Catálogo', exact: true })).toBeVisible();
}
test('login → carrinho singleton shell/remote → checkout → histórico', async ({ page }) => {
  const browserRequests: string[] = [];
  page.on('request', (request) => browserRequests.push(request.url()));
  await login(page);
  await page.getByRole('button', { name: 'Adicionar Teclado 1', exact: true }).click();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
  await page.getByRole('link', { name: /Carrinho/ }).click();
  await expect(page.getByRole('heading', { name: 'Finalizar pedido' })).toBeVisible();
  expect(await page.getByTestId('remote-instance').textContent()).toBe(
    await page.getByTestId('shell-instance').textContent(),
  );
  await page.getByLabel('Nome completo', { exact: true }).fill('Ana Silva');
  await page.getByLabel('E-mail', { exact: true }).fill('ana@demo.local');
  await page.getByLabel('Endereço completo').fill('Rua das Flores, 100');
  await page.getByLabel('CEP (8 dígitos)').fill('12345678');
  await page.getByLabel('Aceito os termos').check();
  await page.getByRole('button', { name: 'Finalizar pedido', exact: true }).click();
  await expect(page.getByText('Pedido finalizado com sucesso!')).toBeVisible();
  await expect(page.getByTestId('cart-count')).toHaveText('0');
  expect(browserRequests.some((url) => url.includes('/remote/remoteEntry.json'))).toBe(true);
  expect(browserRequests.some((url) => url.includes('/api/orders'))).toBe(true);
  expect(browserRequests.every((url) => new URL(url).origin === 'http://localhost:4200')).toBe(
    true,
  );
  await page.getByRole('link', { name: 'Voltar ao histórico' }).click();
  await expect(page.getByRole('heading', { name: /Pedido [a-f0-9]/ }).first()).toBeVisible();
});
test('modal prende foco, Escape preserva dados e confirma saída', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: /Carrinho/ }).click();
  await page.getByLabel('Nome completo').fill('Nome alterado');
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Continuar editando' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel('Nome completo')).toHaveValue('Nome alterado');
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await dialog.getByRole('button', { name: 'Descartar alterações' }).click();
  await expect(page.getByRole('heading', { name: 'Catálogo', exact: true })).toBeVisible();
});
test('cliente não entra na administração e permanece autenticado', async ({ page }) => {
  await login(page);
  await page.evaluate(() => history.pushState({}, '', '/admin'));
  await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')));
  await expect(page.getByRole('heading', { name: 'Acesso não permitido' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
});
test('remote indisponível mantém shell e apresenta fallback', async ({ page }) => {
  await page.route('**/remote/remoteEntry.json', (route) => route.abort());
  await login(page);
  await page.getByRole('button', { name: 'Adicionar Teclado 1', exact: true }).click();
  await page.getByRole('link', { name: /Carrinho/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Pedidos temporariamente indisponíveis' }),
  ).toBeVisible();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
});
test('admin renova sessão expirada e usa operações ordenadas', async ({ page, request }) => {
  const session = await (
    await request.post('http://localhost:3000/api/login', {
      data: { email: 'admin@demo.local', password: 'demo123' },
    })
  ).json();
  const headers = { Authorization: `Bearer ${session.token}` };
  await request.patch('http://localhost:3000/api/admin/products/1', {
    headers,
    data: { stock: 20 },
  });
  await request.post('http://localhost:3000/api/orders', {
    headers,
    data: {
      customer: {
        name: 'Ana Silva',
        email: 'ana@demo.local',
        address: 'Rua das Flores, 100',
        postalCode: '12345678',
        acceptTerms: true,
      },
      lines: [{ productId: '1', quantity: 1 }],
    },
  });
  await login(page, 'admin');
  await page.getByRole('link', { name: 'Administração', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Administração', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Expirar meu token' }).click();
  await expect(
    page.getByText('Token expirado. Atualize o painel para observar a renovação.'),
  ).toBeVisible();
  const renewal = page.waitForResponse(
    (response) => response.url().endsWith('/api/refresh') && response.status() === 200,
  );
  await page.getByRole('button', { name: 'Atualizar painel' }).click();
  await renewal;
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Separar', exact: true }).first().click();
  await page.getByRole('button', { name: 'Enviar', exact: true }).first().click();
  await expect(page.getByText(/Ana Silva.*Enviado/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Repor três produtos' }).click();
  await expect(page.getByText('3 de 3 produtos repostos.')).toBeVisible();
});
test('busca com debounce, filtro atual ao voltar e paginação', async ({ page }) => {
  await login(page);
  const search = page.getByLabel('Buscar produto');
  await search.fill('Teclado');
  await expect(page.getByRole('button', { name: /Adicionar/ })).toHaveCount(4);
  await expect(
    page.getByRole('button', { name: 'Adicionar Mouse 2', exact: true }),
  ).not.toBeVisible();
  await page.getByRole('link', { name: 'Meus pedidos' }).click();
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await expect(page.getByLabel('Buscar produto')).toHaveValue('Teclado');
  await page.getByLabel('Buscar produto').fill('');
  await expect(page.getByRole('button', { name: /Adicionar/ })).toHaveCount(6);
  await page.getByRole('button', { name: 'Próxima', exact: true }).click();
  await expect(page.getByText('Página 2 de 4')).toBeVisible();
  await page.getByLabel('Categoria', { exact: true }).selectOption('Acessórios');
  await expect(page.getByText('Página 1 de 2')).toBeVisible();
});
test('erro recuperável no catálogo preserva sessão e carrinho', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Adicionar Teclado 1', exact: true }).click();
  let failed = false;
  await page.route('**/api/products?*', async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"message":"Falha simulada"}',
      });
    } else await route.continue();
  });
  await page.getByLabel('Buscar produto').fill('Mouse');
  await expect(page.getByText('Não foi possível carregar o catálogo.')).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('button', { name: /Adicionar Mouse/ })).toHaveCount(4);
  await expect(page.getByTestId('cart-count')).toHaveText('1');
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
});
test('viewport mobile sem overflow e navegação por teclado', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByLabel('Buscar produto').focus();
  await page.keyboard.type('Mouse');
  await expect(page.getByRole('button', { name: /Adicionar Mouse/ })).toHaveCount(4);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Categoria', { exact: true })).toBeFocused();
  await page.getByRole('link', { name: /Carrinho/ }).click();
  await expect(page.getByLabel('Nome completo')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('proxy aceita o host encaminhado do Codespaces', async ({ request }) => {
  const response = await request.get('http://localhost:4200/api/health', {
    headers: { Host: 'portal-lab-4200.app.github.dev' },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});
