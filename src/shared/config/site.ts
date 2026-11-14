/**
 * Datos globales y fijos del sitio.
 * Lo que el admin puede editar (WhatsApp, barra de anuncio, redes) vendrá de Firestore: settings/site.
 */
export const SITE = {
  name: 'Excentrix',
  tagline: 'Perfumería',
  description:
    'Excentrix Perfumería: perfumes de nicho, diseñador y árabes en frasco completo y decants. Compra fácil por WhatsApp.',
  locale: 'es_CO',
  lang: 'es-CO',
  currency: 'COP',
} as const;
