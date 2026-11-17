import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildAvailabilityMessage,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
} from '../src/modules/whatsapp/lib/message';

const perfume = { name: 'Delina', brand: 'Parfums de Marly' };
const url = 'https://excentrix.web.app/perfume/delina-parfums-de-marly';
const line = (message: string) => message.split('\n')[1];

describe('Mensaje de WhatsApp por línea', () => {
  it('inspiración: "Inspirado en" y solo el tamaño', () => {
    const msg = buildWhatsAppMessage({
      perfume,
      variant: { line: 'inspiracion', type: 'frasco', ml: 30, price: 30000 },
      url,
    });
    assert.equal(line(msg), 'Inspirado en Delina (Parfums de Marly) · 30 ml — $ 30.000');
  });
  it('réplica 1.1: nombra la versión', () => {
    const msg = buildWhatsAppMessage({
      perfume,
      variant: { line: 'replica', type: 'frasco', ml: 100, price: 180000 },
      url,
    });
    assert.equal(line(msg), 'Delina (Parfums de Marly) · Réplica 1.1 · 100 ml — $ 180.000');
  });
  it('original: nombra la versión', () => {
    const msg = buildWhatsAppMessage({
      perfume,
      variant: { line: 'original', type: 'frasco', ml: 100, price: 950000 },
      url,
    });
    assert.equal(line(msg), 'Delina (Parfums de Marly) · Original · 100 ml — $ 950.000');
  });
  it('incluye el saludo y el enlace a la ficha', () => {
    const msg = buildWhatsAppMessage({
      perfume,
      variant: { line: 'original', type: 'frasco', ml: 100, price: 1 },
      url,
    });
    assert.ok(msg.startsWith('Hola Excentrix, quiero comprar:'));
    assert.ok(msg.endsWith(url));
  });
  it('no deja espacios de no separación', () => {
    const msg = buildWhatsAppMessage({
      perfume,
      variant: { line: 'replica', type: 'frasco', ml: 100, price: 180000 },
      url,
    });
    assert.equal(msg.includes('\u00A0'), false);
  });
  it('mensaje de disponibilidad', () => {
    const msg = buildAvailabilityMessage(perfume, url, {
      line: 'replica',
      type: 'frasco',
      ml: 100,
    });
    assert.ok(msg.includes('quiero saber si tendrán disponible'));
    assert.ok(msg.includes('Réplica 1.1 · 100 ml'));
  });
});

describe('buildWhatsAppUrl', () => {
  it('limpia el número y codifica el mensaje', () => {
    assert.equal(
      buildWhatsAppUrl('+57 300-123-4567', 'Hola & chao'),
      'https://wa.me/573001234567?text=Hola%20%26%20chao',
    );
  });
});
