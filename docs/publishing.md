# Publishing Memorying

## Write and preview

1. Copy one of the existing folders under `src/content/writing/`.
2. Give the folder a stable lowercase English slug with hyphens.
3. Keep `draft: true` while writing.
4. Run `npm run dev` and open the local article route.
5. Run `npm run check`, `npm test`, and `npm run build`.
6. Set `draft: false` only after the title, description, language, type, dates, links, and images are final.
7. Commit and push, then inspect the Cloudflare preview before promoting the change.

Published slugs are permanent. Add an explicit Cloudflare redirect before renaming one.

## Send a full Essay through Buttondown

1. Publish the Essay on Memorying and verify its canonical URL.
2. Open the Buttondown dashboard and create a new email in Markdown mode.
3. Transfer the complete standard-Markdown content.
4. Replace site-only MDX components or media embeds with email-safe text, images, or links.
5. Add the canonical Memorying URL.
6. Send a test email and inspect desktop and mobile rendering.
7. Manually approve the send.

Publishing a site change never sends email automatically. Notes are not newsletter content by default.

## Configure Cloudflare Pages

1. Import this GitHub repository into Cloudflare Pages.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Set `SITE_URL` to the final `https://` production origin, without a trailing path.
5. Set `PUBLIC_BUTTONDOWN_USERNAME` to the actual Buttondown username.
6. Deploy and confirm that `_headers`, `sitemap-index.xml` or `sitemap-0.xml`, canonical URLs, and the Buttondown form action are present.

## Launch checklist

- [ ] Replace or explicitly approve the two draft starter posts.
- [ ] Publish at least one Essay and one Note.
- [ ] Confirm Home, About, Writing, Work, Privacy, individual posts, and 404.
- [ ] Check 320, 390, 768, 1024, and 1440 pixel layouts.
- [ ] Run `npm run verify` locally.
- [ ] Confirm Cloudflare preview and production builds.
- [ ] Subscribe using a real test email.
- [ ] Complete Buttondown confirmation if enabled.
- [ ] Send and receive a full-Essay test newsletter.
- [ ] Verify the canonical link and unsubscribe flow.
- [ ] Confirm Privacy wording matches the live Buttondown configuration.
- [ ] Run Lighthouse on Home, Writing, and one Essay; target at least 90 in Performance, Accessibility, Best Practices, and SEO.
