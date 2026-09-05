import type { ImageMetadata } from 'astro';
import type { WritingArticle, WritingLanguage } from './writing';

export interface AutomaticWritingCover {
  image: ImageMetadata;
  alt: Record<WritingLanguage, string>;
}

export type AutomaticWritingCovers = Record<string, AutomaticWritingCover>;

export type AutomaticWritingCoverModules = Record<string, { default: ImageMetadata }>;
export type AutomaticWritingCoverAltModules = Record<string, string>;

export function collectAutomaticWritingCovers(
  coverModules: AutomaticWritingCoverModules,
  coverAltModules: AutomaticWritingCoverAltModules,
): AutomaticWritingCovers {
  const covers: AutomaticWritingCovers = {};
  const coverSlugs = new Set<string>();

  for (const [path, module] of Object.entries(coverModules)) {
    const directory = path.slice(0, path.lastIndexOf('/'));
    const slug = directory.split('/').at(-1);
    if (!slug) continue;
    if (coverSlugs.has(slug)) {
      throw new Error(`Writing article "${slug}" has multiple cover images. Keep only one cover file.`);
    }
    coverSlugs.add(slug);

    const ko = coverAltModules[`${directory}/cover.alt.ko.txt`]?.trim();
    const en = coverAltModules[`${directory}/cover.alt.en.txt`]?.trim();
    if (!ko || !en) continue;

    covers[slug] = { image: module.default, alt: { ko, en } };
  }

  return covers;
}

export function applyAutomaticWritingCovers(
  articles: readonly WritingArticle[],
  covers: AutomaticWritingCovers,
): WritingArticle[] {
  return articles.map((article) => {
    const cover = covers[article.slug];
    if (!cover || article.coverImage) return article;

    return {
      ...article,
      coverImage: cover.image,
      coverImageAlt: cover.alt,
    };
  });
}
