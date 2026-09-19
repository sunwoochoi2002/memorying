import type { ImageMetadata } from 'astro';
import { describe, expect, it } from 'vitest';
import {
  applyAutomaticWritingCovers,
  collectAutomaticWritingCovers,
  type AutomaticWritingCovers,
} from '../../src/lib/writing-covers';
import type { WritingArticle } from '../../src/lib/writing';

const article = (overrides: Partial<WritingArticle> = {}): WritingArticle => ({
  slug: 'alone',
  publishedAt: new Date('2025-11-21T00:00:00Z'),
  type: 'essay',
  originalLanguage: 'ko',
  draft: false,
  featured: false,
  translations: {
    ko: { language: 'ko', title: '홀로-', description: '홀로 있는 시간에 대한 기록입니다.' },
    en: { language: 'en', title: 'Alone—', description: 'A reflection on time spent alone.' },
  },
  ...overrides,
});

const image: ImageMetadata = {
  src: '/_astro/alone.cover.png',
  width: 1200,
  height: 800,
  format: 'png',
};

describe('automatic writing covers', () => {
  it('adds a complete optional cover pair to its matching article only', () => {
    const covers: AutomaticWritingCovers = {
      alone: {
        image,
        alt: { ko: '창가에 놓인 헤드폰', en: 'Headphones by a window' },
      },
    };

    const [resolved] = applyAutomaticWritingCovers([article()], covers);

    expect(resolved.coverImage).toBe(image);
    expect(resolved.coverImageAlt).toEqual(covers.alone.alt);
  });

  it('leaves an article text-only when no cover image exists', () => {
    const [resolved] = applyAutomaticWritingCovers([article()], {});

    expect(resolved.coverImage).toBeUndefined();
    expect(resolved.coverImageAlt).toBeUndefined();
  });

  it('shows a photo without alt-text files as decorative with empty alt text', () => {
    const covers = collectAutomaticWritingCovers(
      { '../content/writing/alone/cover.png': { default: image } },
      {},
    );

    expect(covers).toEqual({ alone: { image, alt: { ko: '', en: '' } } });
  });

  it('uses a provided alt-text file for its language and empty text for the other', () => {
    const covers = collectAutomaticWritingCovers(
      { '../content/writing/alone/cover.png': { default: image } },
      { '../content/writing/alone/cover.alt.ko.txt': '  창가에 놓인 헤드폰\n' },
    );

    expect(covers.alone.alt).toEqual({ ko: '창가에 놓인 헤드폰', en: '' });
  });

  it('gives an article its cover while other articles stay text-only', () => {
    const covers = collectAutomaticWritingCovers(
      { '../content/writing/alone/cover.png': { default: image } },
      {},
    );
    const [alone, other] = applyAutomaticWritingCovers(
      [article(), article({ slug: 'teammates' })],
      covers,
    );

    expect(alone.coverImage).toBe(image);
    expect(alone.coverImageAlt).toEqual({ ko: '', en: '' });
    expect(other.coverImage).toBeUndefined();
  });

  it('rejects multiple cover images for one article instead of choosing one arbitrarily', () => {
    expect(() => collectAutomaticWritingCovers(
      {
        '../content/writing/alone/cover.jpg': { default: image },
        '../content/writing/alone/cover.png': { default: image },
      },
      {
        '../content/writing/alone/cover.alt.ko.txt': '창가에 놓인 헤드폰',
        '../content/writing/alone/cover.alt.en.txt': 'Headphones by a window',
      },
    )).toThrow('Writing article "alone" has multiple cover images. Keep only one cover file.');
  });

  it('preserves an explicit metadata cover over an automatic convention cover', () => {
    const manualImage: ImageMetadata = { ...image, src: '/_astro/manual.png' };
    const manualAlt = { ko: '수동 표지', en: 'Manual cover' };
    const [resolved] = applyAutomaticWritingCovers([
      article({ coverImage: manualImage, coverImageAlt: manualAlt }),
    ], {
      alone: { image, alt: { ko: '자동 표지', en: 'Automatic cover' } },
    });

    expect(resolved.coverImage).toBe(manualImage);
    expect(resolved.coverImageAlt).toEqual(manualAlt);
  });
});
