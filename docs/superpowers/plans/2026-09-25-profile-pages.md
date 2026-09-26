# Profile Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax for tracking.

**Goal:** Deliver approved About / Writing / Projects / Experience navigation with faithful resume-sourced bilingual content and a private local preview.

**Architecture:** Retain Astro content collections, YAML authoring, shared bilingual fragments and native disclosures. About becomes a summary; Projects holds three authored projects; Experience groups the remaining public resume content. Reuse existing components where appropriate without retaining misleading page-specific names unnecessarily.

**Tech Stack:** Astro 7, TypeScript, YAML, Vitest, Playwright.

**Spec:** docs/superpowers/specs/2026-09-25-profile-pages-design.md

## Global Constraints

- Follow all copy and privacy requirements in the spec and the user's latest request.
- Keep current public dates and all pre-existing writing edits; original profile snapshot is /tmp/memorying-restructure-baseline/profile.yaml.
- Intro and military wording remain unchanged; source-absent CES 2026 remains unchanged. Existing Work English is the fallback for Sunwoo’s Archive.
- One implementer; strict failing test before implementation; task review and final review before delivery.
- Current checkout is already a feature branch with user changes. Work in place to keep those changes available in preview. No commits, branch switching, pushes, or production changes.

## Review Focus

1. English source sentences must not be replaced with existing profile paraphrases. Unit tests compare the migrated long descriptions with normalized source excerpts.
2. Intro and source-absent content must survive migration. Pin exceptions against starting data and assert both languages.
3. Narrow mobile header and long project/award names must not overflow. Browser tests include 320px and 390px.
4. The old Work URL must not break existing incoming links. Test its destination and rendered Projects content.
5. Language switching, native details, anchor navigation and no-JS rendering must work on new pages, not only About.

## Task 1: Complete the integrated page migration

This is one coherent implementation/review unit: schema, content, route and navigation changes are interdependent. The implementer performs small internal red/green steps and runs focused tests between them.

**Files:**
- Modify src/content/about/profile.yaml, src/content/about/README.md, src/lib/content-schema.ts, src/content.config.ts, src/pages/about.astro, src/pages/work.astro, src/components/SiteHeader.astro, src/styles/global.css (confirm exact stylesheet filename).
- Create src/content/projects/*.yaml, src/content/experience/*.yaml, src/pages/projects.astro, src/pages/experience.astro and shared profile components as needed.
- Update existing Work loading/types/components only as required to remove active duplication. Do not refactor writing.
- Tests: tests/unit/profile-pages.test.ts and relevant schema tests; tests/e2e/home-and-work.spec.ts, tests/e2e/profile-pages.spec.ts; update route arrays in accessibility/layout/responsive tests and old Work navigation assertions.
- Docs: Korean authoring README and directly affected maintenance/structure instructions.

**Interfaces:**
- Consumes docs/resume.md, starting profile snapshot, existing Work YAML, LanguageToggle and data-language-fragment conventions.
- Produces /about/, /projects/, /experience/, usable legacy /work/, four-link primary navigation, schema-validated bilingual YAML, complete test coverage.

- [ ] Write focused failing unit/browser tests. Example assertions:

```ts
await page.goto('/about/');
await expect(page.locator('main h2')).toHaveText(['Selected Affiliations']);
await expect(page.locator('main details')).toHaveCount(0);
await expect(page.locator('nav[aria-label="Primary"] a')).toHaveText(['About', 'Writing', 'Projects', 'Experience']);
await page.goto('/projects/');
await expect(page.getByRole('heading', { name: 'JARVIS', exact: true })).toBeVisible();
await expect(page.getByRole('heading', { name: 'BERA', exact: true })).toBeVisible();
await page.goto('/experience/');
await expect(page.getByRole('heading', { name: 'Education', exact: true })).toBeVisible();
```

- [ ] Run focused tests and record intended failure before changing production code. Use npm test -- tests/unit/profile-pages.test.ts and focused Playwright tests. Environment: ASTRO_DEV_BACKGROUND=1 env -u CLAUDECODE.
- [ ] Implement schemas/YAML migration. English source narrative extraction may normalize whitespace and strip Markdown formatting only. Translate naturally into Korean, preserving named entities. Avoid fabricated educational qualifications: display current student/major, not an awarded degree. Keep public dates.
- [ ] Implement compact About, bilingual Projects, sectioned Experience with internal anchors, legacy Work handling, responsive four-item header. Avoid new dependencies.
- [ ] Update stale tests to assert the new product contract, preserving existing coverage. Add exact source-copy checks for substantial paragraphs and preservation checks for exceptions. Check no-JS and both languages, and real old route behavior.
- [ ] Update Korean authoring instructions for the final file layout, source priority, dates and content maintenance.
- [ ] Run focused tests; self-review content mapping and git diff. Report files, red/green evidence, tests, and any uncertainties to controller. Do not commit.
- [ ] Controller dispatches independent task review; implementer fixes confirmed findings and reruns relevant tests.
- [ ] Controller performs final review, npm run verify, desktop/mobile screenshot review, and starts fixture-free private preview. Verify existing writing hashes and git diff --check.
