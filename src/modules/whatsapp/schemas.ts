/**
 * Tipos mínimos que necesita WhatsApp. Son estructurales a propósito: este módulo no importa de
 * `product` (la dependencia va product → whatsapp), así que cualquier perfume/presentación que
 * tenga estos campos sirve.
 */
export interface WhatsAppPerfume {
  name: string;
  brand: string;
  /** Versión inspirada: el mensaje dice "Inspirado en {name} ({brand})". */
  inspired?: boolean;
}

export interface WhatsAppVariant {
  /** Línea de la presentación; el mensaje la nombra (Inspiración, Réplica 1.1, Original). */
  line?: 'inspiracion' | 'replica' | 'original';
  type: 'decant' | 'frasco';
  ml: number;
  price: number;
  condition?: 'nuevo' | 'tester';
}

export interface WhatsAppMessageInput {
  perfume: WhatsAppPerfume;
  variant: WhatsAppVariant;
  /** URL absoluta de la ficha del perfume. */
  url: string;
  greeting?: string;
}
