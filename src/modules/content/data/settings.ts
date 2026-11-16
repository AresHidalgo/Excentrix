import type { SiteSettings } from '../schemas';

/**
 * Ajustes editables desde el admin (PLAN §4, settings/site). Valores de muestra: en la fase 3
 * se leen de Firestore. Las redes son marcadores de posición hasta tener las cuentas reales.
 */
const SETTINGS: SiteSettings = {
  announcementBar: { text: 'Envío gratis por compras desde $179.999', active: true },
  social: {
    instagram: 'https://www.instagram.com/',
    tiktok: 'https://www.tiktok.com/',
    handle: '@excentrix.perfumeria',
  },
};

export function getMockSettings(): SiteSettings {
  return SETTINGS;
}
