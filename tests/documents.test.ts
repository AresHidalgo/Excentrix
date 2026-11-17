import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  OffersSchema,
  PerfumeDocSchema,
  PerfumeImageSchema,
  SiteSettingsDocSchema,
} from '../src/modules/product/documents';

const now = new Date().toISOString();
const off = { active: false, sizes: [] };
const inspiration = { active: true, sizes: [{ ml: 30, available: true }] };

const perfume = {
  slug: 'delina-parfums-de-marly',
  name: 'Delina',
  brandId: 'parfums-de-marly',
  description: '',
  gender: 'mujer',
  house: 'nicho',
  concentration: null,
  olfactoryFamily: [],
  notes: { top: [], heart: [], base: [] },
  categoryIds: [],
  offers: { inspiracion: inspiration, replica: off, original: off },
  badges: [],
  leadTime: null,
  images: [],
  featured: false,
  sortOrder: 0,
  status: 'published',
  createdAt: now,
  updatedAt: now,
};

const image = {
  url: 'https://res.cloudinary.com/dmc8ifonk/image/upload/v1/excentrix/perfumes/delina/frente.jpg',
  publicId: 'excentrix/perfumes/delina/frente',
  alt: 'Perfume inspirado en Delina',
  kind: 'producto',
  width: 800,
  height: 1000,
};

describe('PerfumeDocSchema', () => {
  it('acepta un perfume válido', () => {
    assert.equal(PerfumeDocSchema.safeParse(perfume).success, true);
  });
  it('rechaza un slug con mayúsculas o espacios', () => {
    assert.equal(PerfumeDocSchema.safeParse({ ...perfume, slug: 'Delina Marly' }).success, false);
  });
  it('rechaza un género desconocido', () => {
    assert.equal(PerfumeDocSchema.safeParse({ ...perfume, gender: 'otro' }).success, false);
  });
});

describe('OffersSchema (líneas)', () => {
  it('acepta solo inspiración', () => {
    assert.equal(
      OffersSchema.safeParse({ inspiracion: inspiration, replica: off, original: off }).success,
      true,
    );
  });
  it('acepta réplica 1.1 con precio', () => {
    const replica = { active: true, sizes: [{ ml: 100, price: 180000, available: true }] };
    assert.equal(
      OffersSchema.safeParse({ inspiracion: off, replica, original: off }).success,
      true,
    );
  });
  it('rechaza que ninguna línea esté activa', () => {
    assert.equal(
      OffersSchema.safeParse({ inspiracion: off, replica: off, original: off }).success,
      false,
    );
  });
  it('rechaza una línea activa sin tamaños', () => {
    const replica = { active: true, sizes: [] };
    assert.equal(
      OffersSchema.safeParse({ inspiracion: inspiration, replica, original: off }).success,
      false,
    );
  });
  it('rechaza precio 0', () => {
    const original = { active: true, sizes: [{ ml: 100, price: 0, available: true }] };
    assert.equal(
      OffersSchema.safeParse({ inspiracion: off, replica: off, original }).success,
      false,
    );
  });
  it('rechaza tamaños repetidos', () => {
    const replica = {
      active: true,
      sizes: [
        { ml: 100, price: 1, available: true },
        { ml: 100, price: 2, available: true },
      ],
    };
    assert.equal(
      OffersSchema.safeParse({ inspiracion: off, replica, original: off }).success,
      false,
    );
  });
});

describe('PerfumeImageSchema', () => {
  it('acepta una imagen de Cloudinary', () => {
    assert.equal(PerfumeImageSchema.safeParse(image).success, true);
  });
  it('rechaza una URL fuera de Cloudinary', () => {
    assert.equal(
      PerfumeImageSchema.safeParse({ ...image, url: 'https://example.com/a.jpg' }).success,
      false,
    );
  });
});

describe('SiteSettingsDocSchema', () => {
  const settings = {
    sizes: [{ ml: 30, price: 30000, note: 'Perfecto para regalar' }],
    whatsappNumber: '573001234567',
    announcementBar: { text: 'Envío gratis', active: true },
    updatedAt: now,
  };
  it('acepta ajustes válidos', () => {
    assert.equal(SiteSettingsDocSchema.safeParse(settings).success, true);
  });
  it('rechaza un WhatsApp con letras', () => {
    assert.equal(
      SiteSettingsDocSchema.safeParse({ ...settings, whatsappNumber: '57abc' }).success,
      false,
    );
  });
});
