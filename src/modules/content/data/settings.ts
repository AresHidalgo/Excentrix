import { readSiteSettings } from '@shared/lib/firestore-build';
import type { SiteSettings } from '../schemas';

/**
 * Ajustes del sitio (PLAN §4, settings/site). La barra de anuncio se lee en el build de
 * Firestore (editable en /admin); sin credenciales se usa el valor por defecto. Las redes son
 * marcadores de posición hasta tener las cuentas reales.
 */
const DEFAULT_ANNOUNCEMENT = { text: 'Envío gratis por compras desde $179.999', active: true };

const remote = await readSiteSettings();
const bar = remote?.announcementBar as { text?: unknown; active?: unknown } | undefined;
const announcementBar =
  bar && typeof bar.text === 'string' && typeof bar.active === 'boolean'
    ? { text: bar.text, active: bar.active }
    : DEFAULT_ANNOUNCEMENT;

const SETTINGS: SiteSettings = {
  announcementBar,
  social: {
    instagram: 'https://www.instagram.com/',
    tiktok: 'https://www.tiktok.com/',
    handle: '@excentrix.perfumeria',
  },
};

export function getMockSettings(): SiteSettings {
  return SETTINGS;
}
