# Notion Archive Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish four bilingual Korean-original articles from the preserved Notion export in the Memorying MVP.

**Architecture:** The raw Notion export stays in `docs/imports/notion-archive-2026-09-05/` and is not loaded by Astro. Four independent article directories in `src/content/writing/` use the existing `meta.yaml` plus `ko.mdx`/`en.mdx` collection contract; no application code changes are needed because the established data loader and pages already support public bilingual articles.

**Tech Stack:** Astro 7, MDX, YAML content collections, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-05-notion-archive-migration-design.md`

## Global Constraints

- Retain the original Notion export intact at `docs/imports/notion-archive-2026-09-05/`; it must not become a content collection input.
- Create only the stable slugs `teammates`, `time-for-change`, `keep-it-up`, and `alone`.
- Every imported article requires `meta.yaml`, `ko.mdx`, and `en.mdx`.
- Korean is the declared original language; the Korean title and description display first.
- Each article is public (`draft: false`), an unfeatured `essay`, dated exactly from the export, and has no cover image or tags.
- English is a natural draft that preserves the Korean meaning and reflective voice rather than translating mechanically.
- Preserve draft exclusion for the existing starter articles and do not modify deployment, Buttondown, Notion automation, Cloudflare, DNS, or `SITE_URL`.

---

### Task 1: Publish and verify the four imported bilingual essays

**Files:**
- Modify: `tests/unit/production-writing.test.ts`
- Modify: `tests/e2e/writing.spec.ts`
- Modify: `tests/e2e/home-and-work.spec.ts`
- Create: `src/content/writing/teammates/meta.yaml`
- Create: `src/content/writing/teammates/ko.mdx`
- Create: `src/content/writing/teammates/en.mdx`
- Create: `src/content/writing/time-for-change/meta.yaml`
- Create: `src/content/writing/time-for-change/ko.mdx`
- Create: `src/content/writing/time-for-change/en.mdx`
- Create: `src/content/writing/keep-it-up/meta.yaml`
- Create: `src/content/writing/keep-it-up/ko.mdx`
- Create: `src/content/writing/keep-it-up/en.mdx`
- Create: `src/content/writing/alone/meta.yaml`
- Create: `src/content/writing/alone/ko.mdx`
- Create: `src/content/writing/alone/en.mdx`

**Interfaces:**
- Consumes: the existing Astro `writing` and `writingMeta` collection contracts in `src/content.config.ts`, and the public filtering behavior in `src/lib/content-data.ts`.
- Produces: four `WritingArticle` records consumed without code changes by the home page, archive, detail route, sitemap, and existing language-toggle UI.

- [ ] **Step 1: Replace the production-empty-archive expectation with the four-article public-output contract.**

  In `tests/unit/production-writing.test.ts`, add this constant after `drafts`:

  ```ts
  const imported = [
    { slug: 'alone', title: '홀로-' },
    { slug: 'keep-it-up', title: 'Keep it up!' },
    { slug: 'time-for-change', title: '변화가 필요한 시점.' },
    { slug: 'teammates', title: 'Teammates' },
  ];
  ```

  Replace `builds a public-empty writing archive` with:

  ```ts
  it('builds the four imported Korean-original essays into the public prototype', () => {
    expect(archive).not.toContain('아직 공개된 글이 없습니다. 곧 이곳에 Essay와 Note를 기록할 예정입니다.');
    expect(archive).toContain('data-writing-filters');

    for (const article of imported) {
      expect(archive).toContain(article.title);
      expect(homepage).toContain(article.title);
      expect(existsSync(`dist/writing/${article.slug}/index.html`)).toBe(true);
      expect(sitemap).toContain(`https://example.com/writing/${article.slug}/`);
    }
  });
  ```

  Keep all existing assertions that starter articles remain excluded from the production archive, homepage, routes, and sitemap.

- [ ] **Step 2: Update browser contracts to require the public articles before they exist.**

  In `tests/e2e/writing.spec.ts`, declare:

  ```ts
  const importedKoreanTitles = ['홀로-', 'Keep it up!', '변화가 필요한 시점.', 'Teammates'];
  ```

  In the initial archive assertions, require every title to be visible, update the visible item count and `statusText` from `2` to `6`, and assert the first archive item is `홀로-` with `lang="ko"` and date `2025-11-21`. Update every later All-filter and reset count/status expectation from `2` to `6`; retain the Note-filter count of `1` and its `A small beginning` assertion. In the no-JavaScript archive test, require all four titles and update the item count to `6`.

  In `tests/e2e/home-and-work.spec.ts`, require the four Korean-original titles in the recent-writing list, while retaining the starter article assertions. Do not change the person-first heading or footer assertions.

- [ ] **Step 3: Run the focused tests to verify the import contract fails before content exists.**

  Run:

  ```bash
  npm test -- tests/unit/production-writing.test.ts
  npm run test:e2e -- tests/e2e/writing.spec.ts tests/e2e/home-and-work.spec.ts
  ```

  Expected: both commands fail because the four public article directories and their generated public routes do not exist yet.

- [ ] **Step 4: Add the article metadata and Korean-original content.**

  Create the four `meta.yaml` files exactly as follows:

  ```yaml
  # teammates/meta.yaml
  publishedAt: 2025-09-13
  type: essay
  originalLanguage: ko
  draft: false
  featured: false

  # time-for-change/meta.yaml
  publishedAt: 2025-10-14
  type: essay
  originalLanguage: ko
  draft: false
  featured: false

  # keep-it-up/meta.yaml
  publishedAt: 2025-11-14
  type: essay
  originalLanguage: ko
  draft: false
  featured: false

  # alone/meta.yaml
  publishedAt: 2025-11-21
  type: essay
  originalLanguage: ko
  draft: false
  featured: false
  ```

  Copy each original Korean body from its matching raw export file into the matching `ko.mdx` body. Use these Korean frontmatter values:

  ```yaml
  # teammates/ko.mdx
  ---
  title: Teammates
  description: 반가운 얼굴들과 한국에서 다시 마주한 날의 기록입니다.
  ---

  # time-for-change/ko.mdx
  ---
  title: 변화가 필요한 시점.
  description: 흐트러진 리듬을 되돌리기 위해 변화가 필요하다고 느낀 날의 기록입니다.
  ---

  # keep-it-up/ko.mdx
  ---
  title: Keep it up!
  description: 비교를 멈추고 나만의 길을 믿으며 다시 마음을 다잡는 기록입니다.
  ---

  # alone/ko.mdx
  ---
  title: 홀로-
  description: 홀로 있는 시간 속에서 나를 가꾸고 다듬는 마음에 대한 기록입니다.
  ---
  ```

- [ ] **Step 5: Add complete English translation drafts.**

  Create `en.mdx` for every article with this exact frontmatter and translation body. Preserve paragraphs and emphasis; do not include `[Draft]` markers.

  ```mdx
  <!-- teammates/en.mdx -->
  ---
  title: Teammates
  description: A record of a day in Korea spent face to face with familiar, welcome people.
  ---

  # Welcome to Korea!

  Some familiar faces came to Korea.

  I never thought I would see, right in front of me, the faces I had only seen in Slack profile pictures.

  They were exactly as I had imagined them: bright and cheerful.

  Perhaps because I have been taking a break from work lately, with the semester starting and our retreat happening at the same time, talking again felt a little awkward. My English did not come out easily, so I may have rambled a little.

  Even so, looking at the photos now, I think my sincerity made it across.

  I had bought gifts for the two of them, as well as Akash, Yasemin, and Jiwon K.

  Shashank and Jiwon were celebrating their birthdays, and the other three were people I had worked with often.

  I wondered what kind of gift would feel most meaningful and memorable to them while they were in Korea. In the end, two days before the party, I bought an Osulloc Thank You Tea Set.

  Thankfully, they were truly happy to receive it. I could see it in their faces.

  It made me so happy.

  It makes me happy to be able to give someone I care about a joy that comes with real feeling.

  In that moment, the money and time I had spent did not matter.

  This is not to weigh money and time so carefully, but the joy of that moment outweighed every bit of effort that went into preparing for it.

  I am surrounded by so many good people.

  As much as I hold them dear, I hope they hold me dear too.

  Even if they do not, I hope they know what is in my heart.

  The more I work as an intern and earn money, the more generous my hands become. It worries me a little.

  I should earn a lot, if only so I can keep sharing. 😅
  ```

  ```mdx
  <!-- time-for-change/en.mdx -->
  ---
  title: A Time for Change.
  description: A record from the day I felt I needed a change to find my rhythm again.
  ---

  I have not been able to focus very well lately.

  Even when I study or work, I have a strong feeling that I am rushing just to get things done.

  I slept plenty during the holiday, but I still do not feel properly rested.

  Is it the burnout people always talk about?

  Or a vague heaviness before enlisting?

  Or maybe it is simply because the weather has been awful every day lately.

  What autumn? It is just summer with lower temperatures.

  Whatever it is, I need a change. A change.

  1. **Stepping away from short-lived dopamine**

  Looking back, I think the things that have been causing problems are all things that give me short-lived dopamine.

  I deleted Instagram, YouTube, and my stock-trading app from my phone.

  Other than occasionally opening YouTube for something long-form, let us try to live clean for as long as possible.

  1. **A promise**

  No matter how small it is, if I made a plan, I will keep it.

  That is how I will build trust and confidence in myself again, and return to a healthier, more unhurried life.

  Let us see, after some time has passed.

  ---

  Comments via KakaoTalk…
  ```

  ```mdx
  <!-- keep-it-up/en.mdx -->
  ---
  title: Keep It Up!
  description: A note about setting comparison aside, trusting my own path, and steadying myself again.
  ---

  Do not compare yourself. Walk your own path.

  They are different from me, and I am different from them.

  In truth, comparison itself does not hold up.

  Let us not doubt ourselves.

  My limits last only until the moment I begin to doubt myself.

  P.S. I did not mean to, but it has been exactly a month since my last post. I think I may have changed a little. I believe in the power of compounding. Keep it up!
  ```

  ```mdx
  <!-- alone/en.mdx -->
  ---
  title: Alone—
  description: A reflection on tending to and refining myself in the time I spend alone.
  ---

  Nothing stays the same.

  I, the people around me, everything becomes something new every moment, even if only a little.

  What differs from person to person is whether those changes have been meaningful.

  I think a momentary change becomes meaningful when I am alone—when I can focus only on the feelings and realizations I find within myself.

  I may be alone as a person, but the music, spaces, and time I love are always with me.

  Let me enjoy those moments fully.

  Let me not concern myself with other people, with something I have placed beyond the boundary I draw for myself.

  Even now, do I not know that I am someone who needs time alone?

  Let me nurture myself and hone myself more sharply.

  The headphones I bought impulsively early this month feel like no regret at all now.
  ```

- [ ] **Step 6: Run the focused tests to verify the implementation passes.**

  Run:

  ```bash
  npm test -- tests/unit/production-writing.test.ts
  npm run test:e2e -- tests/e2e/writing.spec.ts tests/e2e/home-and-work.spec.ts
  ```

  Expected: PASS. The production build has exactly four newly public Korean-original essays, while the two starter drafts remain excluded from production.

- [ ] **Step 7: Review source parity and content quality before commit.**

  Compare every `ko.mdx` body with the matching Markdown file under `docs/imports/notion-archive-2026-09-05/`. Confirm that each `en.mdx` has non-empty title, description, and body; that no public translation includes `[Draft]` or generated placeholder text; and that `meta.yaml` dates are `2025-09-13`, `2025-10-14`, `2025-11-14`, and `2025-11-21` respectively.

- [ ] **Step 8: Commit the implementation.**

  ```bash
  git add src/content/writing/teammates src/content/writing/time-for-change src/content/writing/keep-it-up src/content/writing/alone tests/unit/production-writing.test.ts tests/e2e/writing.spec.ts tests/e2e/home-and-work.spec.ts
  git commit -m "feat: migrate bilingual archive writing"
  ```
