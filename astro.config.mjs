// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const { PUBLIC_SITE_URL } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  // Dominio base único: canónicas, sitemap, Open Graph y enlaces de WhatsApp salen de aquí.
  site: PUBLIC_SITE_URL || 'https://excentrix.web.app',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // /perfume/x.html → Firebase Hosting lo sirve como /perfume/x (cleanUrls)
    format: 'file',
  },
  integrations: [
    // Islas públicas livianas: todos los módulos menos el admin
    // Los patrones se comparan con rutas absolutas: deben empezar con **/
    preact({
      include: ['**/src/modules/**/*.tsx', '**/src/shared/**/*.tsx'],
      exclude: ['**/src/modules/admin/**'],
    }),
    // Dashboard de administrador
    react({ include: ['**/src/modules/admin/**'] }),
    sitemap({
      // Admin y maquetas de diseño (fase 1) fuera del sitemap
      filter: (page) => !page.includes('/admin') && !page.includes('/maquetas'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
