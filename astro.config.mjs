// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  adapter: cloudflare(),
  integrations: [sitemap()],
  site: 'https://www.middledot.com',
  trailingSlash: 'always',
});
