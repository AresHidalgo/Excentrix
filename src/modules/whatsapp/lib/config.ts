import { readSiteSettings } from '@shared/lib/firestore-build';

/**
 * Número y saludo de WhatsApp. El número se lee en el build de Firestore
 * (settings/site.whatsappNumber, editable en /admin → Precios y ajustes). Mientras no esté
 * configurado se usa un marcador de posición.
 */
const settings = await readSiteSettings();
const configured =
  typeof settings?.whatsappNumber === 'string' && /^\d{10,15}$/.test(settings.whatsappNumber)
    ? settings.whatsappNumber
    : null;

export const WHATSAPP_PHONE = configured ?? '57XXXXXXXXXX';
export const WHATSAPP_GREETING = 'Hola Excentrix, quiero comprar:';
export const WHATSAPP_GENERAL_MESSAGE = 'Hola Excentrix, quiero hacer una consulta.';
