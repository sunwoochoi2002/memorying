# Memorying Product Design

**Date:** 2026-07-24
**Status:** Approved design
**Product:** Person-first personal blog, archive, and secondary newsletter

## 1. Product intent

Memorying is Sunwoo Choi's personal home on the web. Its primary purpose is person-first blogging and long-term archiving. Newsletter delivery is a secondary distribution channel, not the organizing principle of the site.

The product serves two audiences at once:

- returning readers who already know Sunwoo and want to follow his writing;
- new visitors who need a concise introduction to Sunwoo, his interests, and selected work.

The MVP supports two writing formats:

- **Essay:** developed long-form writing that may be sent as a newsletter;
- **Note:** shorter observations, links, fragments, and records that remain site-first.

Posts may be Korean or English. Translation is optional and is never required for publication.

## 2. Design references and direction

The design draws on these references without reproducing any one of them:

- [BZCF](https://bzcf.io/) for a restrained chronological writing feed and email subscription;
- [Yoonchul Yi](https://yoonchulyi.com/about/) for person-first identity, selected work, and writing navigation;
- [Sohyeon Kim](https://ohmyksh.github.io/) for a concise personal homepage with writing as a separate destination;
- the supplied `image.png` for the Korean personal introduction and the theme of preserving memories over time.

The approved homepage direction combines:

- a top navigation of `Sunwoo Choi / About / Writing / Work`;
- a single-column personal introduction;
- a warm editorial treatment for featured and recent writing;
- no subscription call to action in global navigation.

The introduction follows this visual hierarchy:

1. `Hello, I’m Sunwoo.` as the primary heading;
2. `시간이 지나도 잊고 싶지 않은 것들을 기록합니다.` as the main statement;
3. a smaller supporting introduction:
   - `안녕하세요, 최선우입니다.`
   - `이 공간에 도착한 당신을 환영합니다.`
   - `일상에서 발견하는 행복과 가치, 그리고 꿈에 관해 씁니다.`

These lines appear in one column on every viewport. Typography and line length create hierarchy; the copy is not split into a two-column layout.

## 3. Scope

### 3.1 MVP capabilities

- Person-first responsive homepage
- About page
- Writing archive containing Essays and Notes
- Individual writing pages generated from MDX
- All/Essay/Note filtering
- All/Korean/English filtering
- Bookmarkable filter query parameters
- Selected Work page
- Email-only Buttondown subscription form within Writing and Essay pages
- Manual full-Essay newsletter sending through Buttondown
- Privacy page
- Designed empty states and 404 page
- SEO, sitemap, canonical metadata, and social-sharing metadata

### 3.2 Explicit exclusions

- User accounts or authentication
- Owner/admin dashboard
- Browser-based content editor
- Database
- Native comments or reactions
- GitHub-backed comments
- Tags
- Full-text search
- Related-post recommendations
- View or share counters
- Scheduled publishing
- Automatic newsletter delivery
- Native subscriber storage
- Language-specific site copies or mandatory translations
- Individual Work detail pages
- Paid analytics or newsletter add-ons

## 4. Technical architecture

Memorying is a static-first Astro application deployed on Cloudflare Pages.

```text
GitHub repository
├── Astro layouts and components
├── Essay and Note MDX files
├── Work data
└── Images and media
         │
         ▼
Cloudflare Pages build
         │
         ▼
Static HTML, CSS, and minimal client JavaScript
         │
         ├── Readers
         └── Buttondown subscription endpoint
```

### 4.1 Responsibilities

**GitHub** stores source code, MDX originals, media, structured Work data, and change history.

**Astro** validates content, generates routes and metadata, renders HTML, and hydrates only the interactive archive filters and mobile navigation.

**Cloudflare Pages** builds from GitHub, provides preview and production deployments, serves static assets through its CDN, manages HTTPS, and connects a custom domain.

**Buttondown** stores subscriber email addresses, processes subscriptions and cancellations, provides the manual newsletter editor, sends email, and handles delivery failures.

The site remains readable if Buttondown is unavailable. Publishing a site change never triggers an email automatically.

### 4.2 Cost assumption

The MVP targets the free Cloudflare Pages tier and Buttondown's free tier for the first 100 active subscribers. A custom domain is a separate annual registration expense. No paid Cloudflare functions, Buttondown add-ons, database, or analytics service is required.

## 5. Information architecture

```text
/
├── /about/
├── /writing/
│   └── /writing/[slug]/
├── /work/
├── /privacy/
└── /404
```

### 5.1 Home

The homepage introduces Sunwoo, presents one featured Essay, shows two or three recent items, and links to the complete archive. It does not include a prominent subscription form or global Subscribe navigation item.

### 5.2 About

About provides a longer personal introduction, current interests, values and direction, concise background, contact details, and social links. It is not a full résumé.

### 5.3 Writing

Writing is the canonical chronological archive. It includes type and language filters and the primary email subscription form.

### 5.4 Individual writing

Each Essay or Note page includes title, description, type, language, publication date, optional update date, optional cover image, MDX content, and a restrained archive return link. Essay pages include a secondary subscription form after the content; Note pages do not.

### 5.5 Work

Work lists selected projects in an intentional order with title, period, role, concise description, status, optional image, and optional external link. The MVP has no Work detail routes.

### 5.6 Privacy

Privacy explains that the site collects only an email address for newsletter delivery, that Buttondown processes and stores it, how to unsubscribe, and how to contact Sunwoo.

## 6. Content model

### 6.1 Writing collection

Essays and Notes share one validated Astro content collection.

```yaml
title: 기억은 어떻게 장소가 되는가
description: 개인 아카이브와 기억에 관한 글
publishedAt: 2026-07-24
updatedAt: 2026-07-24
type: essay
language: ko
draft: true
featured: true
coverImage: ./cover.jpg
```

Required fields are `title`, `description`, `publishedAt`, `type`, `language`, and `draft`.

Optional fields are `updatedAt`, `featured`, `coverImage`, and `canonicalUrl`.

Valid values:

- `type`: `essay` or `note`;
- `language`: `ko` or `en`.

Essay and Note are authorial intent, not automatic word-count classifications. Only Essays may be featured or selected for newsletter delivery.

### 6.2 Slugs

The MDX path determines the stable public slug. Slugs use lowercase English words and hyphens even when the title is Korean.

```text
src/content/writing/memory-as-a-place/index.mdx
→ /writing/memory-as-a-place/
```

Published slugs are permanent. Any unavoidable change requires an explicit redirect from the previous URL.

### 6.3 Drafts and dates

Drafts are visible locally but excluded from production routes, lists, counts, metadata, and sitemap output.

`publishedAt` records the original publication date and does not change. `updatedAt` is added only for a meaningful content change, not a minor typo correction.

Future-dated public content and scheduled publishing are not supported in the MVP.

### 6.4 Featured Essay

At most one published Essay may set `featured: true`. Multiple featured Essays, or a featured Note, fail validation. If no Essay is explicitly featured, the latest published Essay is selected. If no Essay exists, the featured region is omitted rather than filled by a Note.

### 6.5 Work collection

Work uses separate structured entries.

```yaml
title: Memorying
period: 2026
role: Designer and Developer
description: A personal writing and archival space.
status: active
order: 1
```

`title`, `period`, `role`, `description`, and `order` are required. `status`, `url`, and `image` are optional. `order` controls presentation rather than publication date.

### 6.6 Media

Post media is colocated with its MDX when practical. Images require meaningful alternative text and web-appropriate compression. Local media is preferred over remote hotlinks. Large files and a dedicated media CDN are outside the MVP.

External media embeds must retain a descriptive fallback and direct link. An embed failure cannot prevent the surrounding article from being read.

## 7. Publishing and newsletter workflows

### 7.1 Site publishing

```text
Copy a writing template
→ write with draft: true
→ preview locally
→ run content validation and production build
→ set draft: false
→ commit and push
→ inspect Cloudflare preview/production output
→ verify the live URL
```

### 7.2 Newsletter delivery

Newsletter sending is intentionally separate from site deployment.

```text
Publish and verify an Essay on the site
→ open Buttondown
→ transfer the full standard-Markdown content
→ adapt web-only elements for email
→ add the canonical site link
→ send a test email
→ inspect desktop and mobile rendering
→ manually approve the send
```

The initial MVP sends full Essays, not short notifications. Notes are not sent by default. Newsletter-eligible Essays should favor standard Markdown; web-only MDX components require a deliberate email-safe replacement.

## 8. Components and interactions

The implementation uses small components with narrow responsibilities:

```text
SiteHeader
MobileNavigation
SiteFooter
PersonalIntroduction
FeaturedWriting
WritingCard
WritingArchive
WritingFilters
NewsletterSignup
WorkList
ProseLayout
ContentMetadata
```

### 8.1 Navigation

Desktop navigation is `Sunwoo Choi / About / Writing / Work`. The name links home. The active destination is indicated. The header is not sticky. Mobile preserves direct links where space permits and uses a compact menu only when necessary. Core links remain accessible without JavaScript.

### 8.2 Archive filters

Two independent filters are available:

- Type: All, Essay, Note
- Language: All, 한국어, English

Their state is represented in query parameters, for example `/writing/?type=essay&lang=ko`. Filtered URLs are bookmarkable, reload safely, and participate in browser history. Unsupported query values are ignored. Without JavaScript, every public item remains visible.

### 8.3 Newsletter form

The form appears in the Writing introduction and after individual Essays. It collects only an email address and includes consent copy and a Privacy link. Memorying owns the initial, browser-validation, and submitting states. Buttondown's supported form response owns confirmation, already-subscribed, rate-limit, and provider-error outcomes. If Buttondown returns those outcomes through a provider page or redirect rather than a cross-origin machine-readable response, the MVP follows that provider flow instead of adding a server-side proxy merely to reproduce the status inline.

Submissions go directly to Buttondown; Memorying does not store subscriber emails. Client-side validation and failures that occur before provider navigation preserve the entered address and allow retry. Once Buttondown takes ownership through a response page or redirect, its documented behavior governs address retention and retry.

### 8.4 Responsive behavior

The design is fluid rather than derived from fixed screenshot dimensions. It supports widths from 320px upward, uses a bounded desktop content width near 1180px, keeps prose near a comfortable 65–75 characters per line, and chooses breakpoints based on content failure rather than device labels.

### 8.5 Accessibility

The MVP requires semantic HTML, logical headings, keyboard access, visible focus, sufficient contrast, properly associated form labels and errors, image alternatives, adequate touch targets, reduced-motion support, and a document order that remains logical for assistive technology.

## 9. Failure handling and edge cases

Build validation rejects missing required metadata, unsupported values, invalid dates, duplicate slugs, missing local images, future-dated public posts, multiple featured Essays, and featured Notes. Errors identify the file and invalid field.

Intentional empty states cover:

- no public writing;
- no Essay available for the featured region;
- a valid filter combination with no results.

Unsupported filter query values fall back safely to the unfiltered archive.

The 404 page retains global navigation and links to Home and Writing.

Cloudflare build failure leaves the last successful production deployment active. Buttondown failure affects only subscription attempts. External embed failure affects only the embed.

## 10. Verification strategy

### 10.1 Static checks

- TypeScript and Astro checks
- Content schema validation
- Duplicate-slug and featured-entry validation
- Local image and internal-link validation
- Production build

### 10.2 Unit tests

- chronological sorting and deterministic tie behavior;
- production draft exclusion;
- featured Essay selection and fallback;
- type, language, and combined filtering;
- filter reset and unsupported query handling;
- content validation rules.

### 10.3 Browser tests

- Home → Writing → filter → article → archive flow;
- global and mobile navigation;
- query persistence, reload, history, and empty results;
- newsletter validation, submitting, success, provider failure, network failure, retained input, and duplicate-submit prevention;
- 404 behavior.

Automated newsletter tests mock Buttondown responses and never create real subscribers.

### 10.4 Accessibility and responsive checks

Automated accessibility scans must report no serious or critical violations. Manual checks cover keyboard navigation, focus order, 200% zoom, reduced motion, and representative screen-reader structure.

Representative widths are 320, 390, 768, 1024, and 1440 pixels. Home, Writing, long Korean and English Essays, media content, Work, Privacy, and 404 must avoid horizontal overflow, collisions, and unreadable line lengths.

### 10.5 Performance and metadata

Reading content must work without JavaScript. External embeds are lazy-loaded. Images declare dimensions and use optimized formats. Representative Lighthouse scores target at least 90 for Performance, Accessibility, Best Practices, and SEO, while concrete regressions take priority over the score itself.

Every public page requires an appropriate title, description, canonical URL, `lang`, Open Graph data, and sitemap entry. Drafts are excluded. The 404 page is not indexed.

### 10.6 Launch-only manual checks

Cloudflare and Buttondown account integration requires manual verification:

1. inspect the Cloudflare preview deployment;
2. test core navigation and responsive layouts;
3. subscribe with a test email;
4. complete confirmation if configured;
5. send and receive a full-Essay test newsletter;
6. verify the canonical link and unsubscribe flow;
7. confirm Privacy copy matches the live provider configuration.

## 11. MVP completion criteria

The MVP is complete only when:

- static checks, unit tests, browser tests, and production build pass;
- no serious or critical accessibility violations remain;
- representative responsive layouts have been checked;
- at least one Essay and one Note render correctly;
- Korean and English content and filters work correctly;
- Cloudflare preview and production deployment work;
- a real Buttondown test subscription, full-Essay delivery, and unsubscribe flow have been verified;
- Privacy copy matches actual data handling;
- no excluded feature has entered the implementation unintentionally.
