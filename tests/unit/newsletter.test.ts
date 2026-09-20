import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { buildNewsletter, writeNewsletter } from '../../scripts/newsletter.mjs';

const temporaryRoots: string[] = [];
const siteUrl = 'https://sunwoochoi.com';

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

async function createArticle(
  slug: string,
  options: { originalLanguage?: 'ko' | 'en'; draft?: boolean; type?: string } = {},
) {
  const root = await mkdtemp(join(tmpdir(), 'memorying-newsletter-'));
  temporaryRoots.push(root);
  const directory = join(root, slug);
  await mkdir(directory);
  await writeFile(
    join(directory, 'meta.yaml'),
    `publishedAt: 2026-09-01\ntype: ${options.type ?? 'essay'}\noriginalLanguage: ${options.originalLanguage ?? 'ko'}\ndraft: ${options.draft ?? false}\nfeatured: false\n`,
  );
  await writeFile(
    join(directory, 'ko.md'),
    `---\ntitle: 여름을 기억하며\n---\n\n첫 문단입니다.\n\n둘째 문단입니다.\n`,
  );
  await writeFile(
    join(directory, 'en.md'),
    `---\ntitle: Remembering summer\n---\n\nFirst paragraph.\n`,
  );
  return root;
}

describe('newsletter template', () => {
  it('uses the original-language title as the subject and the body verbatim', async () => {
    const root = await createArticle('remembering-summer');

    const mail = await buildNewsletter({ root, slug: 'remembering-summer', siteUrl });

    expect(mail.language).toBe('ko');
    expect(mail.subject).toBe('여름을 기억하며');
    expect(mail.body.startsWith('첫 문단입니다.\n\n둘째 문단입니다.\n')).toBe(true);
    expect(mail.body).not.toContain('title:');
  });

  it('ends with one fixed footer: canonical article URL and the author name', async () => {
    const root = await createArticle('remembering-summer');

    const { body } = await buildNewsletter({ root, slug: 'remembering-summer', siteUrl });

    expect(body.endsWith(
      '\n---\n\n웹에서 읽기 · Read on the web\nhttps://sunwoochoi.com/writing/remembering-summer/\n\nSunwoo Choi\n',
    )).toBe(true);
  });

  it('follows the declared original language and allows an explicit override', async () => {
    const root = await createArticle('remembering-summer', { originalLanguage: 'en' });

    const original = await buildNewsletter({ root, slug: 'remembering-summer', siteUrl });
    const korean = await buildNewsletter({ root, slug: 'remembering-summer', siteUrl, language: 'ko' });

    expect(original.subject).toBe('Remembering summer');
    expect(original.body.startsWith('First paragraph.\n')).toBe(true);
    expect(korean.subject).toBe('여름을 기억하며');
  });

  it('tolerates a trailing slash on the site URL', async () => {
    const root = await createArticle('remembering-summer');

    const { body } = await buildNewsletter({ root, slug: 'remembering-summer', siteUrl: `${siteUrl}/` });

    expect(body).toContain('https://sunwoochoi.com/writing/remembering-summer/\n');
    expect(body).not.toContain('com//writing');
  });

  it('allows notes as well as essays', async () => {
    const root = await createArticle('quiet-note', { type: 'note' });

    await expect(buildNewsletter({ root, slug: 'quiet-note', siteUrl })).resolves.toMatchObject({
      subject: '여름을 기억하며',
    });
  });

  it('refuses drafts, unknown slugs, and unsafe slugs', async () => {
    const root = await createArticle('hidden', { draft: true });

    await expect(buildNewsletter({ root, slug: 'hidden', siteUrl })).rejects.toThrow(/draft/i);
    await expect(buildNewsletter({ root, slug: 'missing', siteUrl })).rejects.toThrow(/missing/);
    await expect(buildNewsletter({ root, slug: '../escape', siteUrl })).rejects.toThrow(/Invalid writing slug/);
  });

  it('rejects an unsupported language', async () => {
    const root = await createArticle('remembering-summer');

    await expect(
      buildNewsletter({ root, slug: 'remembering-summer', siteUrl, language: 'fr' }),
    ).rejects.toThrow(/language/i);
  });

  it('writes the body to an ignored output folder and never overwrites articles', async () => {
    const root = await createArticle('remembering-summer');
    const outputDirectory = join(root, '.newsletter');

    const mail = await buildNewsletter({ root, slug: 'remembering-summer', siteUrl });
    const written = await writeNewsletter({ mail, slug: 'remembering-summer', outputDirectory });

    expect(written).toBe(join(outputDirectory, 'remembering-summer.ko.md'));
    expect(await readFile(written, 'utf8')).toBe(mail.body);
    expect((await readdir(join(root, 'remembering-summer'))).sort()).toEqual(['en.md', 'ko.md', 'meta.yaml']);
  });
});

describe('newsletter for the real archive', () => {
  it('builds a well-formed mail for every published article', async () => {
    const root = join(process.cwd(), 'src/content/writing');
    const slugs = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());
    let checked = 0;

    for (const { name } of slugs) {
      const meta = await readFile(join(root, name, 'meta.yaml'), 'utf8');
      if (/^draft:\s*true\s*$/m.test(meta)) continue;

      const mail = await buildNewsletter({ root, slug: name, siteUrl });
      expect(mail.subject.trim().length, name).toBeGreaterThan(0);
      expect(mail.body, name).toContain(`${siteUrl}/writing/${name}/`);
      expect(mail.body.endsWith('\nSunwoo Choi\n'), name).toBe(true);
      expect(mail.body, name).not.toMatch(/^---\s*$\n\s*title:/m);
      checked += 1;
    }

    expect(checked).toBeGreaterThan(0);
  });
});
