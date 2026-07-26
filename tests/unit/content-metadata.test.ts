import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import ContentMetadata from '../../src/components/ContentMetadata.astro';
import type { WritingArticle } from '../../src/lib/writing';

const item: WritingArticle = {
  slug: 'synthetic-metadata',
  publishedAt: new Date('2026-07-24T00:30:00Z'),
  updatedAt: new Date('2026-01-02T23:30:00-11:00'),
  type: 'essay',
  originalLanguage: 'en',
  draft: false,
  featured: false,
  translations: {
    ko: { language: 'ko', title: '합성 제목', description: '합성 설명' },
    en: { language: 'en', title: 'Synthetic title', description: 'Synthetic description' },
  },
};

describe('ContentMetadata', () => {
  it('renders published and updated dates as UTC calendar dates with ISO datetimes', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ContentMetadata, { props: { item } });
    const { document } = parseHTML(html);
    const dates = [...document.querySelectorAll('time')];

    expect(dates).toHaveLength(2);
    expect(dates[0].textContent).toBe('2026-07-24');
    expect(dates[0].getAttribute('datetime')).toBe('2026-07-24T00:30:00.000Z');
    expect(dates[1].textContent).toBe('2026-01-03');
    expect(dates[1].getAttribute('datetime')).toBe('2026-01-03T10:30:00.000Z');
  });
});
