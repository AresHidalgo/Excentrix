export type { WhatsAppMessageInput, WhatsAppPerfume, WhatsAppVariant } from './schemas';
export { WHATSAPP_GREETING, WHATSAPP_PHONE } from './lib/config';
export {
  buildAvailabilityMessage,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  perfumeLine,
  variantLabel,
} from './lib/message';
export { default as WhatsAppButton } from './components/WhatsAppButton.astro';
export { default as WhatsAppFloat } from './components/WhatsAppFloat.astro';
