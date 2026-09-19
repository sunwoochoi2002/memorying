import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  vite: {
    build: {
      // public/_headers sets default-src 'self', which blocks data: fonts, so never inline assets.
      assetsInlineLimit: 0,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith('/404'),
    }),
  ],
});
