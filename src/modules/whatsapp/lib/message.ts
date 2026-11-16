import { formatPrice } from '@shared/lib/format';
import type { WhatsAppMessageInput, WhatsAppPerfume, WhatsAppVariant } from '../schemas';
import { WHATSAPP_GREETING } from './config';

/** "Decant 10 ml" · "Frasco 100 ml" · "Frasco 100 ml (tester)". */
export function variantLabel(variant: Pick<WhatsAppVariant, 'type' | 'ml' | 'condition'>): string {
  if (variant.type === 'decant') return `Decant ${variant.ml} ml`;
  return `Frasco ${variant.ml} ml${variant.condition === 'tester' ? ' (tester)' : ''}`;
}

/** WhatsApp no necesita espacios de no separación: se normalizan a espacios comunes. */
function plain(text: string): string {
  return text.replace(/\u00A0/g, ' ');
}

/**
 * Mensaje de compra con el formato del plan:
 * "Hola Excentrix, quiero comprar:\nKhamrah – Lattafa · Decant 10 ml — $ 36.999\nhttps://…"
 */
export function buildWhatsAppMessage({
  perfume,
  variant,
  url,
  greeting = WHATSAPP_GREETING,
}: WhatsAppMessageInput): string {
  const line = `${perfume.name} – ${perfume.brand} · ${variantLabel(variant)} — ${formatPrice(variant.price)}`;
  return plain(`${greeting}\n${line}\n${url}`);
}

/** Mensaje para preguntar por un perfume (o presentación) agotado. */
export function buildAvailabilityMessage(
  perfume: WhatsAppPerfume,
  url: string,
  variant?: Pick<WhatsAppVariant, 'type' | 'ml' | 'condition'>,
): string {
  const what = variant
    ? `${perfume.name} – ${perfume.brand} · ${variantLabel(variant)}`
    : `${perfume.name} – ${perfume.brand}`;
  return plain(`Hola Excentrix, quiero saber si tendrán disponible:\n${what}\n${url}`);
}

/** Enlace wa.me con el mensaje ya escrito. Acepta el número con o sin "+", espacios o guiones. */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/[^\dX]/gi, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
