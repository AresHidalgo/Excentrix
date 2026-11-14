# Arquitectura de Excentrix

Arquitectura **modular por dominio** sobre Astro. Cada módulo agrupa todo lo de una parte del
negocio (componentes, lógica, esquemas y carga de datos) en una sola carpeta. Las páginas de
`src/pages/` son delgadas: solo arman rutas usando lo que exportan los módulos.

```
src/
├─ pages/                  # Rutas. Sin lógica de negocio: importan de los módulos.
├─ modules/
│  ├─ catalog/             # Colecciones, filtros, orden, tarjeta de perfume, reglas de secciones automáticas
│  ├─ product/             # Ficha de perfume, galería, selector de presentaciones, pirámide olfativa
│  ├─ whatsapp/            # Armado del mensaje y del enlace wa.me, botón de compra, botón flotante
│  ├─ search/              # Búsqueda con Pagefind
│  ├─ content/             # Páginas de contenido: inicio, "¿Qué es un decant?", legales, banners
│  └─ admin/               # Dashboard (React): auth, CRUD, subida a Cloudinary, botón Publicar
└─ shared/
   ├─ config/              # Constantes del sitio (nombre, idioma, moneda)
   ├─ lib/                 # Utilidades puras sin dominio (formato de precio, slugs)
   ├─ layouts/             # BaseLayout (SEO, Open Graph, fuentes)
   ├─ styles/              # Tokens de marca y CSS global (Tailwind v4)
   └─ ui/                  # Componentes visuales genéricos: botón, insignia, píldora, contenedor
```

## Estructura interna de un módulo

```
modules/<modulo>/
├─ components/   # .astro (estáticos) y .tsx (islas interactivas)
├─ lib/          # lógica pura y testeable
├─ data/         # lectura de Firestore en build (solo módulos que lo necesitan)
├─ schemas.ts    # esquemas Zod y tipos del dominio
└─ index.ts      # API pública del módulo: lo único que otros importan
```

## Reglas de dependencia

1. `pages/` puede importar de `modules/*` y `shared/*`.
2. Un módulo importa de `shared/*` y **solo del `index.ts`** de otro módulo, nunca de sus archivos
   internos.
3. `shared/` no importa de ningún módulo.
4. `admin/` no es importado por ningún módulo público (no se cuela React en el sitio).
5. Sin dependencias circulares entre módulos. Dirección esperada:
   `content → catalog → product → whatsapp`.

## Islas

- Módulos públicos: islas **Preact** (`.tsx`), hidratadas con `client:visible` o `client:idle`.
- `modules/admin`: **React** (configurado en `astro.config.mjs` por ruta).

## Fuera de `src/`

| Carpeta              | Contenido                                                                  |
| -------------------- | -------------------------------------------------------------------------- |
| `worker/`            | Cloudflare Worker: firma de subidas a Cloudinary y botón Publicar (fase 2) |
| `brand/`             | Fuentes, scripts y SVG maestros del logo                                   |
| `public/brand/`      | Logos, favicon e imagen Open Graph servidos por el sitio                   |
| `.github/workflows/` | CI (calidad + preview por PR) y deploy (main y botón Publicar)             |
