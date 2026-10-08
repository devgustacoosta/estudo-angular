import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function createApi() {
  const app = express();
  app.use(
    cors({ origin: ['http://localhost:4200', 'http://localhost:4201', 'http://127.0.0.1:4200'] }),
  );
  app.use(express.json({ limit: '20kb' }));
  const users = [
    {
      id: 'cliente',
      name: 'Ana Cliente',
      email: 'cliente@demo.local',
      password: 'demo123',
      role: 'customer',
    },
    {
      id: 'admin',
      name: 'Bruno Admin',
      email: 'admin@demo.local',
      password: 'demo123',
      role: 'admin',
    },
  ];
  const products = Array.from({ length: 24 }, (_, i) => ({
    id: String(i + 1),
    name: ['Teclado', 'Mouse', 'Monitor', 'Headset', 'Webcam', 'Suporte'][i % 6] + ' ' + (i + 1),
    category: i % 2 ? 'Acessórios' : 'Computadores',
    price: (i + 1) * 2590,
    stock: 5 + i,
    icon: ['⌨', '◉', '▣', '♫', '◎', '▱'][i % 6],
  }));
  const orders = [];
  const access = new Map();
  const refresh = new Map();
  const controls = { latency: 180, failures: 0 };
  const session = (user) => {
    const token = randomUUID();
    const refreshToken = randomUUID();
    access.set(token, { user, expires: Date.now() + 60000 });
    refresh.set(refreshToken, { user, expires: Date.now() + 3600000 });
    return { token, refreshToken, user: { id: user.id, name: user.name, role: user.role } };
  };
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', async (req, res, next) => {
    await new Promise((resolve) => setTimeout(resolve, controls.latency));
    if (controls.failures > 0 && !req.path.startsWith('/demo')) {
      controls.failures--;
      return res.status(503).json({ message: 'Falha simulada. Tente novamente.' });
    }
    next();
  });
  app.post('/api/login', (req, res) => {
    const user = users.find((u) => u.email === req.body.email && u.password === req.body.password);
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
    res.json(session(user));
  });
  app.post('/api/refresh', (req, res) => {
    const previous = refresh.get(req.body.refreshToken);
    refresh.delete(req.body.refreshToken);
    if (!previous || previous.expires < Date.now())
      return res.status(401).json({ message: 'Sessão expirada.' });
    res.json(session(previous.user));
  });
  app.get('/api/products', (req, res) => {
    const q = String(req.query.q || '').toLowerCase();
    const category = String(req.query.category || '');
    const page = Math.max(1, Number(req.query.page) || 1);
    const filtered = products.filter(
      (p) => p.name.toLowerCase().includes(q) && (!category || p.category === category),
    );
    res.json({ items: filtered.slice((page - 1) * 6, page * 6), total: filtered.length });
  });
  app.use('/api', (req, res, next) => {
    const entry = access.get(req.headers.authorization?.replace(/^Bearer /, ''));
    if (!entry || entry.expires < Date.now())
      return res.status(401).json({ message: 'Autenticação necessária.' });
    req.user = entry.user;
    next();
  });
  app.get('/api/orders', (req, res) => res.json(orders.filter((o) => o.userId === req.user.id)));
  app.get('/api/orders/:id', (req, res) => {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });
    if (order.userId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Você não tem acesso a este pedido.' });
    res.json(order);
  });
  app.post('/api/orders', (req, res) => {
    const { lines, customer } = req.body;
    if (
      !customer ||
      typeof customer.name !== 'string' ||
      customer.name.trim().length < 3 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email || '') ||
      typeof customer.address !== 'string' ||
      customer.address.trim().length < 8 ||
      !/^\d{8}$/.test(customer.postalCode || '') ||
      customer.acceptTerms !== true ||
      !Array.isArray(lines) ||
      !lines.length ||
      lines.length > 24
    ) {
      return res.status(400).json({ message: 'Dados do checkout inválidos.' });
    }
    const quantities = new Map();
    for (const line of lines) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1)
        return res.status(400).json({ message: 'Quantidade inválida.' });
      quantities.set(line.productId, (quantities.get(line.productId) || 0) + line.quantity);
    }
    const checked = [];
    for (const [id, quantity] of quantities) {
      const product = products.find((p) => p.id === id);
      if (!product || quantity > product.stock)
        return res.status(409).json({ message: 'Estoque insuficiente. Atualize o catálogo.' });
      checked.push({ product, quantity });
    }
    const order = {
      id: randomUUID(),
      userId: req.user.id,
      createdAt: new Date().toISOString(),
      status: 'Recebido',
      customer,
      lines: checked.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
      })),
      total: checked.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0),
    };
    checked.forEach(({ product, quantity }) => {
      product.stock -= quantity;
    });
    orders.push(order);
    res.status(201).json(order);
  });
  app.use('/api/admin', (req, res, next) => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Perfil administrador necessário.' });
    next();
  });
  app.get('/api/admin/orders', (_req, res) => res.json(orders));
  app.patch('/api/admin/orders/:id', (req, res) => {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });
    if (!['Recebido', 'Em separação', 'Enviado'].includes(req.body.status))
      return res.status(400).json({ message: 'Status inválido.' });
    order.status = req.body.status;
    res.json(order);
  });
  app.patch('/api/admin/products/:id', (req, res) => {
    const product = products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    if (!Number.isInteger(req.body.stock) || req.body.stock < 0 || req.body.stock > 10000)
      return res.status(400).json({ message: 'Estoque inválido.' });
    product.stock = req.body.stock;
    res.json(product);
  });
  app.post('/api/demo/config', (req, res) => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Perfil administrador necessário.' });
    controls.latency = Math.min(3000, Math.max(0, Number(req.body.latency) || 0));
    controls.failures = Math.min(10, Math.max(0, Number(req.body.failures) || 0));
    res.json(controls);
  });
  app.post('/api/demo/expire', (req, res) => {
    access.get(req.headers.authorization.replace(/^Bearer /, '')).expires = 0;
    res.json({ message: 'Token expirado; a próxima requisição protegida renovará a sessão.' });
  });
  app.use((error, _req, res, _next) => res.status(400).json({ message: 'Requisição inválida.' }));
  return app;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createApi().listen(3000, '127.0.0.1', () =>
    console.log('API educacional: http://localhost:3000/api'),
  );
}
