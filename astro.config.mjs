import { defineConfig } from 'astro/config';

// Fully static. Vercel detects Astro and serves /dist; a push to main redeploys.
export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
