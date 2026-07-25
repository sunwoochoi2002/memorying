# Compact Home and Bilingual Writing Design

**Date:** 2026-07-25

**Status:** Approved design

**Product:** Memorying

**Scope:** Homepage refinement, bilingual Writing model, repository-first authoring

## 1. Purpose and relationship to the MVP design

This document records the approved revisions to the original [Memorying Product Design](./2026-07-24-memorying-design.md). It supersedes the original design wherever the two conflict, especially its homepage composition, optional translation model, language archive filter, and one-file-per-language writing model. All unrelated MVP decisions remain in effect.

The revisions strengthen the primary product goal: Memorying is Sunwoo Choi's quiet personal blog and long-term archive. It should feel like a person's compact home on the web, not a product landing page. Publication and newsletter delivery remain secondary.

## 2. Approved reference direction

The revised home and Writing experience draw primarily from:

- [Sohyeon Kim](https://ohmyksh.github.io/) for a concise personal homepage;
- [Yoonchul Yi](https://yoonchulyi.com/) for a compact, person-first first screen;
- [Yoonchul Yi's blog archive](https://yoonchulyi.com/blog/) for a restrained chronological list;
- [Yoonchul Yi's 2025 Recap](https://yoonchulyi.com/blog/2025-Recap/) for switching between two pre-rendered language panels on one article URL.

The references guide density, hierarchy, and interaction. Memorying keeps its own warm editorial palette, approved copy, navigation, type taxonomy, and subscription placement.

## 3. Homepage experience

### 3.1 Desktop and laptop

The homepage uses the approved quiet editorial one-column stack. It removes the oversized product-style hero, tinted feature region, and large writing cards.

At a supported desktop viewport of 1280 × 720 or larger, the initial viewport contains:

1. the `Sunwoo Choi / About / Writing / Work` header;
2. the personal introduction;
3. a compact recent-writing title and date list;
4. the restrained global footer.

The page may use the normal document flow rather than a rigid `100vh` container. Responsive spacing and type keep these elements above the fold without clipping content or depending on browser chrome dimensions. Smaller-height desktop windows may scroll naturally.

The introduction remains a single column with this hierarchy:

1. `Hello, I’m Sunwoo.`
2. `시간이 지나도 잊고 싶지 않은 것들을 기록합니다.`
3. the supporting copy:
   - `안녕하세요, 최선우입니다.`
   - `이 공간에 도착한 당신을 환영합니다.`
   - `일상에서 발견하는 행복과 가치, 그리고 꿈에 관해 씁니다.`

On desktop, `Hello, I’m Sunwoo.` remains on one line. The Korean statement also remains on one line, using responsive sizing and available width without changing the supporting copy's readable size.

Recent writing appears as a simple text list. Each row includes the original-language title plus type and date. The homepage contains no newsletter form and no writing thumbnails.

### 3.2 Mobile

Mobile preserves readability and allows a short natural scroll instead of forcing every element into one viewport.

The primary heading has an intentional mobile-only break:

```text
Hello,
I’m Sunwoo.
```

The statement `시간이 지나도 잊고 싶지 않은 것들을 기록합니다.` remains on one line on supported mobile widths down to 320 px, matching its one-line desktop treatment. Responsive typography may reduce this line independently, but it must not cause horizontal overflow or shrink the supporting copy.

The header links remain visible without a collapsed menu. Recent-writing metadata moves below the title when horizontal space requires it. The footer remains in the normal page flow.

## 4. Writing archive

Writing is an archive of logical articles, not an archive of language variants.

- The archive retains `Type: All / Essay / Note` filtering.
- The Language filter and `lang` query parameter are removed.
- Each bilingual article appears exactly once.
- The archive row uses the article's original-language title and description plus type and publication date.
- Rows remain text-only, including when an article has a cover image.
- The existing subscription section remains at the bottom of `/writing/`.

The type filter remains progressively enhanced and bookmarkable through `?type=essay` or `?type=note`. Back, forward, reset, empty-state, keyboard, and screen-reader behavior remain supported. Legacy `lang` parameters are ignored and are not emitted by the interface.

## 5. Bilingual article experience

### 5.1 One URL and pre-rendered translations

Every Essay and Note has Korean and English versions before publication. Both versions are rendered into one static page at the stable route:

```text
/writing/[slug]/
```

No language route or language query parameter is introduced. The page includes both versions in its initial HTML; switching languages performs no request and no navigation.

### 5.2 Original-first behavior

Each article records whether Korean or English is the original. On every page load:

- the original-language title, description, body, and image alternative text are visible;
- the translation is present but hidden;
- the original language control carries a small `Original` label;
- canonical, Open Graph, structured-data, and document metadata use the original version.

The page does not remember a visitor's prior language choice between articles or reloads. Each article always begins with its authorial original.

### 5.3 Toggle behavior and accessibility

The detail header includes a compact `한국어 / English` control. Activating it switches the displayed title, description, body, and localized cover alternative text immediately.

The control is a labelled button group. Each button exposes `aria-pressed`; inactive content uses the native `hidden` state; each content panel carries the correct `lang` attribute. The document language is updated to the active language during interaction. With JavaScript unavailable, the complete original article remains readable and the inactive translation stays hidden.

The shared URL and Share action do not encode the selected language. Reloading returns to the original.

### 5.4 Cover images

Cover images are optional. When present, a responsive cover appears below the article header on the detail page only. The homepage and Writing archive stay text-only.

Authors may store JPEG, PNG, WebP, or another locally supported Astro image format beside the article. WebP is a recommendation, not a requirement. Astro accepts the local source and produces optimized responsive output; authors do not need to convert JPEG or PNG files manually.

Both Korean and English alternative text values are required whenever a cover is present. Missing files or localized alternative text fail validation. Articles without a cover render no placeholder or empty image region.

## 6. Repository content model

### 6.1 One folder per logical article

```text
src/content/writing/memorying-start/
├── meta.yaml
├── ko.mdx
├── en.mdx
└── cover.jpg        # optional; the name and supported extension may vary
```

The directory name is the stable lowercase ASCII slug. Published slug rules and redirect requirements from the original design remain unchanged.

### 6.2 Shared metadata

`meta.yaml` owns fields shared by both versions:

```yaml
publishedAt: 2026-07-25
updatedAt:
type: essay
originalLanguage: ko
draft: true
featured: false
coverImage: ./cover.jpg
coverImageAlt:
  ko: 노을이 비치는 바닷가
  en: A beach at sunset
```

Required shared fields are `publishedAt`, `type`, `originalLanguage`, and `draft`. `updatedAt`, `featured`, `coverImage`, and `coverImageAlt` are optional subject to their invariants.

Valid values:

- `type`: `essay` or `note`;
- `originalLanguage`: `ko` or `en`.

Only Essays may be featured, and at most one published Essay may be explicitly featured.

### 6.3 Localized content

`ko.mdx` and `en.mdx` each require localized frontmatter and a body:

```mdx
---
title: Memorying을 시작하며
description: 기억하고 싶은 것들을 위한 첫 기록입니다.
---

본문을 여기에 작성합니다.
```

The loader combines shared metadata and both localized entries into one `WritingArticle` with a `translations.ko` and `translations.en` map. Archive sorting, filtering, featured selection, routes, and newsletter decisions operate on logical articles rather than translation files.

Production publication requires both language files, non-empty localized titles and descriptions, a valid original language, and a renderable body in each language. Drafts also use the paired structure so incomplete content is caught early.

## 7. Repository-first authoring

### 7.1 New writing command

The project provides:

```bash
npm run new:writing -- <slug> --original <ko|en>
```

The command:

- validates the slug and original language;
- refuses to overwrite an existing directory;
- creates `meta.yaml`, `ko.mdx`, and `en.mdx` together;
- starts the article as `draft: true`;
- prints concise next steps.

The generated files contain safe placeholders that fail production publication until completed, without breaking the local authoring workflow.

### 7.2 Notion migration boundary

Notion is used only once to move Sunwoo's historical writing into the repository. No Notion API, automated importer, or ongoing synchronization is built.

Historical content is copied into the appropriate original-language MDX file, translated into the sibling file, reviewed locally, and committed. Embedded Notion images are downloaded into the article directory and changed to local relative references. After the initial migration, the GitHub repository is the sole source of truth and all new writing begins directly in it.

The publishing guide documents file creation, Notion copy-and-paste cleanup, local images, preview, bilingual review, draft publication, and deployment verification.

## 8. Failure handling and validation

Content preparation and production builds fail with an article slug and actionable message for:

- a missing `meta.yaml`, `ko.mdx`, or `en.mdx`;
- invalid shared or localized frontmatter;
- an invalid or missing original language;
- an empty localized title, description, or body;
- mismatched or duplicate language entries;
- an invalid slug;
- future-dated published content;
- a featured Note or multiple published featured Essays;
- a missing local cover file;
- a cover without both localized alternative texts.

The creation command exits without partial overwrites when input is invalid or the target exists. Runtime language switching never fetches remote content, so a network failure cannot make the translation control lose an already-built article. If client JavaScript fails, the original remains the readable fallback.

## 9. Migration and compatibility

The existing drafts migrate without changing their public slugs:

- `memorying-start`: Korean original plus a new English translation;
- `small-beginning`: English original plus a new Korean translation.

Existing one-file content helpers, language filters, cards, and routes are refactored around logical bilingual articles. Work content and routes are unaffected. Newsletter behavior is unchanged: Essays may show the compact end-of-article form; Notes do not.

## 10. Verification and acceptance criteria

### 10.1 Unit and content tests

- valid article directories combine into one logical article;
- missing or malformed pairs fail with actionable errors;
- original-language fields are selected for archives, metadata, and featured content;
- sort, type filter, draft, and featured invariants operate once per article;
- the new-writing command creates all expected files and rejects unsafe input or overwrite attempts;
- optional cover formats and localized alternative-text rules are enforced.

### 10.2 Browser tests

- the desktop homepage fits header, introduction, recent list, and footer at 1280 × 720;
- the desktop heading remains one line and the Korean statement remains one line;
- the mobile heading breaks after `Hello,`;
- the Korean statement remains one line without horizontal overflow down to 320 px;
- mobile content remains readable through a short natural scroll;
- Writing exposes only the Type filter and lists each article once;
- type filtering, query history, reset, focus, and empty-state behavior work;
- article pages initially show the original title, description, body, and `Original` label;
- toggling changes every localized visible field without changing the URL;
- reloading restores the original;
- the original remains readable without JavaScript;
- cover images appear responsively on detail pages only and expose the active localized alternative text;
- articles without covers render cleanly;
- existing accessibility, responsive, newsletter, navigation, metadata, 404, and link checks continue to pass.

### 10.3 Required final verification

The implementation is complete only after Astro diagnostics, unit tests, source-asset checks, production build, built-link checks, and the full Playwright suite pass from a clean working tree state.

## 11. Deployment and domain boundary

This revision does not create a Cloudflare Pages project, purchase or connect a domain, modify DNS, or select the final production hostname.

The code continues to derive canonical absolute URLs from `SITE_URL`, falling back to localhost during development. `/writing/[slug]/` refers only to the internal path appended to whichever production origin is chosen later.

Actual Cloudflare deployment, final `SITE_URL`, and custom-domain setup remain a separate post-MVP deployment step requiring the chosen domain and access to the relevant Cloudflare and DNS accounts.
