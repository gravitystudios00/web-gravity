import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gravity-studios.com',
  output: 'static',

  build: {
    // Un solo archivo CSS en vez de uno por componente.
    inlineStylesheets: 'auto',
  },

  devToolbar: { enabled: false },

  integrations: [
    sitemap({
      // Las variantes de headline llevan noindex en el HTML. Incluirlas en el
      // sitemap sería contradictorio: le estaríamos pidiendo a Google que
      // indexe justo lo que la página le dice que no indexe.
      filter: (page) => !/\/hl\d+\/?$/.test(page),
    }),
  ],
});