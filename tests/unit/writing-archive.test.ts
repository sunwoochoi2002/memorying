import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import WritingArchive from '../../src/components/WritingArchive.astro';
import { loadWritingCategories } from '../../src/lib/writing-categories';

// The real archive has no empty category, so the empty state is checked here with no articles.
const EMPTY_STATE = '이 카테고리에는 아직 공개된 글이 없습니다.';

describe('WritingArchive empty state', () => {
  const pages = [undefined, ...loadWritingCategories().map((category) => category.slug)];

  for (const category of pages) {
    it(`shows the approved empty-state copy on ${category ?? '전체보기'} with no published writing`, async () => {
      const container = await AstroContainer.create();
      const html = await container.renderToString(WritingArchive, { props: { writing: [], category } });
      const { document } = parseHTML(html);

      expect(document.querySelector('.empty-state')?.textContent?.trim()).toBe(EMPTY_STATE);
      expect(document.querySelectorAll('[data-writing-item]')).toHaveLength(0);
      expect(document.querySelectorAll('nav[aria-label="카테고리"] a')).toHaveLength(pages.length);
      for (const count of document.querySelectorAll('.category-nav__count')) expect(count.textContent).toBe('0');
      expect(document.querySelector('form[aria-label="Newsletter subscription"]')).not.toBeNull();
    });
  }
});
