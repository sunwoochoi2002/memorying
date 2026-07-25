import { readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const roots = ['src/content', 'public'].map((root) => resolve(root));
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const maximumBytes = 25 * 1024 * 1024;
const oversized = [];

async function inspect(path) {
  const metadata = await stat(path);
  if (metadata.isDirectory()) {
    for (const entry of await readdir(path)) await inspect(join(path, entry));
    return;
  }
  if (imageExtensions.has(extname(path).toLowerCase()) && metadata.size > maximumBytes) {
    oversized.push(`${relative(process.cwd(), path)} (${metadata.size} bytes)`);
  }
}

for (const root of roots) await inspect(root);

if (oversized.length) {
  console.error(`Images above the 25 MiB limit:\n${oversized.join('\n')}`);
  process.exit(1);
}

console.log('Source image check passed: no image exceeds 25 MiB.');
