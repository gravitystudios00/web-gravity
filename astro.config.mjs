import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gravity-studios.com',
  output: 'static',
  build: {
    // Un solo archivo CSS en vez de uno por componente.
    inlineStylesheets: 'auto',
  },
  devToolbar: { enabled: false },
});
