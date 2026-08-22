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
      // Fuera del sitemap todo lo que lleva noindex en el HTML: incluirlo
      // sería contradictorio, le pediríamos a Google que indexe justo lo que
      // la página le dice que no indexe.
      //   /hl1…/hl3  → variantes de headline, casi iguales a la home
      //   /video-t, /video-j → post-agenda, no tienen sentido fuera del embudo
      filter: (page) => !/\/(hl\d+|video-[tj])\/?$/.test(page),
    }),
  ],
});