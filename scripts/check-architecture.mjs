import { readdir, readFile } from 'node:fs/promises';
const root = 'projects/pedidos-remote/src/app/features/orders/';
async function walk(path) {
  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    const target = `${path}/${entry.name}`;
    if (entry.isDirectory()) await walk(target);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      const source = await readFile(target, 'utf8');
      if (/@angular|HttpClient|from ['"]rxjs|infrastructure|presentation/.test(source))
        throw new Error(`Dependência externa ao núcleo: ${target}`);
    }
  }
}
await walk(root + 'domain');
await walk(root + 'application');
console.log('Núcleo application/domain independente de Angular, HTTP e adapters.');
