import { existsSync, readFileSync } from 'node:fs';
import { posix, resolve } from 'node:path';

/**
 * Structural helpers for repository documents. They look at commands and links only,
 * never at wording, so the author can rewrite any sentence without touching a test.
 */

export const readRepositoryText = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const withoutFencedCode = (markdown: string) => markdown.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');

/** Every `npm run <script>` named anywhere in the text, including code blocks. */
export function npmRunScripts(text: string): string[] {
  return [...new Set([...text.matchAll(/\bnpm run ([A-Za-z0-9:_-]+)/g)].map((match) => match[1]))];
}

export function packageScripts(): string[] {
  return Object.keys(JSON.parse(readRepositoryText('package.json')).scripts ?? {});
}

export interface RelativeLink {
  target: string;
  /** Repository-relative path the link points at, without any `#anchor`. */
  path: string;
}

/**
 * Relative Markdown links (`[text](target)`) outside fenced code, resolved against the
 * document's folder. External (`scheme:`), anchor-only (`#...`) and site-root (`/...`)
 * links are ignored; a trailing `#anchor` or `?query` is dropped.
 */
export function relativeMarkdownLinks(documentPath: string): RelativeLink[] {
  const markdown = withoutFencedCode(readRepositoryText(documentPath));
  const links: RelativeLink[] = [];
  for (const match of markdown.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    const target = match[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#') || target.startsWith('/')) continue;
    const withoutAnchor = decodeURI(target.replace(/[#?].*$/, ''));
    if (withoutAnchor === '') continue;
    links.push({ target, path: posix.normalize(posix.join(posix.dirname(documentPath), withoutAnchor)) });
  }
  return links;
}

export const linkResolves = (link: RelativeLink) => existsSync(resolve(process.cwd(), link.path));

/** Matches `NAME=value` for anything that looks like a credential. */
export const SECRET_ASSIGNMENT = /\b[A-Z0-9_]*(?:API_KEY|TOKEN|PASSWORD|SECRET)\s*=\s*\S+/i;
