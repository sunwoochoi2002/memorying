import type { ImageMetadata } from 'astro';
import type { WritingArticle, WritingLanguage } from './writing';

export interface AutomaticWritingCover {
  image: ImageMetadata;
  alt: Record<WritingLanguage, string>;
}

export type AutomaticWritingCovers = Record<string, AutomaticWritingCover>;

export type AutomaticWritingCoverModules = Record<string, { default: ImageMetadata }>;
export type AutomaticWritingCoverAltModules = Record<string, string>;

/**
 * `articleDirectories` holds the folders of loaded articles, in the same form as the
 * module keys. Only a cover directly inside one of them counts, so a `cover.*` file in an
 * attachment subfolder never becomes a cover.
 */
export function collectAutomaticWritingCovers(
  coverModules: AutomaticWritingCoverModules,
  coverAltModules: AutomaticWritingCoverAltModules,
  articleDirectories: ReadonlySet<string>,
): AutomaticWritingCovers {
  const covers: AutomaticWritingCovers = {};
  const coverSlugs = new Set<string>();

  for (const [path, module] of Object.entries(coverModules)) {
    const directory = path.slice(0, path.lastIndexOf('/'));
    if (!articleDirectories.has(directory)) continue;
    const slug = directory.split('/').at(-1);
    if (!slug) continue;
    if (coverSlugs.has(slug)) {
      throw new Error(`Writing article "${slug}" has multiple cover images. Keep only one cover file.`);
    }
    coverSlugs.add(slug);

    // Alt-text files are optional: without one the photo is decorative (empty alt).
    const ko = coverAltModules[`${directory}/cover.alt.ko.txt`]?.trim() ?? '';
    const en = coverAltModules[`${directory}/cover.alt.en.txt`]?.trim() ?? '';

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
