import { access, readdir, readFile } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { parseHTML } from 'linkedom';

const root = resolve('dist');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return files.flat();
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function resolvesFromBuild(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^[/\\]+/, '');
  const direct = resolve(root, clean);
  const pathFromRoot = relative(root, direct);
  if (pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot)) return false;
  const candidates = extname(clean.replace(/\/+$/, ''))
    ? [direct]
    : [join(direct, 'index.html'), `${direct}.html`];
  for (const candidate of candidates) if (await exists(candidate)) return true;
  return false;
}

function buildUrlFor(file) {
  const builtPath = relative(root, file).split(sep).join('/');
  const pathname = builtPath === 'index.html'
    ? '/'
    : builtPath.endsWith('/index.html')
      ? `/${builtPath.slice(0, -'index.html'.length)}`
      : `/${builtPath}`;
  return new URL(pathname, 'https://memorying.local');
}

const htmlFiles = (await walk(root)).filter((file) => file.endsWith('.html'));
const failures = [];

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const { document } = parseHTML(html);
  for (const element of document.querySelectorAll('[href], [src]')) {
    const value = element.getAttribute('href') ?? element.getAttribute('src');
    if (!value || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('data:')) continue;
    const url = new URL(value, buildUrlFor(file));
    if (url.origin !== 'https://memorying.local') continue;
    if (!(await resolvesFromBuild(url.pathname))) {
      failures.push(`${relative(root, file)} -> ${value}`);
    }
  }
}

if (failures.length) {
  console.error(`Broken generated links:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} generated HTML files: no broken internal links.`);
