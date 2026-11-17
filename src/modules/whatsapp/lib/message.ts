import { formatPrice } from '@shared/lib/format';
import type { WhatsAppMessageInput, WhatsAppPerfume, WhatsAppVariant } from '../schemas';
import { WHATSAPP_GREETING } from './config';

const LINE_TEXT = {
  inspiracion: 'Inspiración',
  replica: 'Réplica 1.1',
  original: 'Original',
} as const;

/**
 * "Decant 10 ml" · "Frasco 100 ml" · "Frasco 100 ml (tester)".
 * Con línea: "30 ml" (inspiración) · "Réplica 1.1 · 100 ml" · "Original · 100 ml".
 */
export function variantLabel(
  variant: Pick<WhatsAppVariant, 'type' | 'ml' | 'condition' | 'line'>,
): string {
  // La inspiración ya se nombra en el perfume ("Inspirado en …"): solo el tamaño.
  if (variant.line === 'inspiracion') return `${variant.ml} ml`;
  if (variant.line) return `${LINE_TEXT[variant.line]} · ${variant.ml} ml`;
  if (variant.type === 'decant') return `Decant ${variant.ml} ml`;
  return `Frasco ${variant.ml} ml${variant.condition === 'tester' ? ' (tester)' : ''}`;
}

/** "Khamrah – Lattafa" o, para una versión inspirada, "Inspirado en Delina (Parfums de Marly)". */
export function perfumeLine(perfume: WhatsAppPerfume, line?: WhatsAppVariant['line']): string {
  if (line === 'inspiracion') return `Inspirado en ${perfume.name} (${perfume.brand})`;
  if (line) return `${perfume.name} (${perfume.brand})`;
  return perfume.inspired
    ? `Inspirado en ${perfume.name} (${perfume.brand})`
    : `${perfume.name} – ${perfume.brand}`;
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
  const line = `${perfumeLine(perfume, variant.line)} · ${variantLabel(variant)} — ${formatPrice(variant.price)}`;
  return plain(`${greeting}\n${line}\n${url}`);
}

/** Mensaje para preguntar por un perfume (o presentación) agotado. */
export function buildAvailabilityMessage(
  perfume: WhatsAppPerfume,
  url: string,
  variant?: Pick<WhatsAppVariant, 'type' | 'ml' | 'condition' | 'line'>,
): string {
  const what = variant
    ? `${perfumeLine(perfume, variant.line)} · ${variantLabel(variant)}`
    : perfumeLine(perfume);
  return plain(`Hola Excentrix, quiero saber si tendrán disponible:\n${what}\n${url}`);
}

/** Enlace wa.me con el mensaje ya escrito. Acepta el número con o sin "+", espacios o guiones. */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/[^\dX]/gi, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
