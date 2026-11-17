import { z } from 'zod';

/**
 * Modelo de los documentos en Firestore (base "default" de excentrix-e7794).
 * Lo comparten el admin (lee/escribe), los scripts (carga inicial) y el build (lee).
 *
 *   perfumes/{slug}   PerfumeDoc       (un perfume puede ofrecerse en 1 a 3 líneas: offers)
 *   brands/{id}       BrandDoc
 *   settings/site     SiteSettingsDoc  (tamaños y precios, WhatsApp, barra de anuncio)
 */

export const GENDERS = ['hombre', 'mujer', 'unisex'] as const;
export const HOUSES = ['nicho', 'disenador', 'arabe'] as const;
export const CONCENTRATIONS = ['EDT', 'EDP', 'Parfum', 'Extrait'] as const;
export const BADGES = ['nuevo', 'bajo-encargo', 'preventa'] as const;
export const IMAGE_KINDS = ['producto', 'ambiente'] as const;
export const STATUSES = ['draft', 'published'] as const;
/**
 * Líneas de producto:
 *   inspiracion  versión inspirada; tamaños con la tabla de precios única (settings/site.sizes)
 *   replica      réplica 1.1 (imitación del perfume y del frasco); precio por perfume
 *   original     producto original de la marca; precio por perfume
 */
export const LINES = ['inspiracion', 'replica', 'original'] as const;

const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones');

const trimmed = (max: number) => z.string().trim().max(max);

/** Imagen guardada en Cloudinary (carpeta excentrix/perfumes/{slug}/). */
export const PerfumeImageSchema = z.object({
  /** URL https de res.cloudinary.com del cloud de Excentrix. */
  url: z
    .url()
    .refine((u) => u.startsWith('https://res.cloudinary.com/'), 'Debe ser una URL de Cloudinary'),
  /** public_id de Cloudinary, p. ej. "excentrix/perfumes/delina-parfums-de-marly/frente". */
  publicId: trimmed(300).min(1),
  alt: trimmed(200),
  kind: z.enum(IMAGE_KINDS),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});

/** Tamaño de la línea Inspiración. El precio viene de settings/site.sizes. */
export const PerfumeSizeSchema = z.object({
  ml: z.number().int().positive(),
  available: z.boolean(),
});

/** Tamaño con precio propio (líneas Réplica 1.1 y Original), en COP. */
export const PricedSizeSchema = z.object({
  ml: z.number().int().positive(),
  price: z.number().int().positive('El precio debe ser mayor que 0'),
  available: z.boolean(),
});

const activeNeedsSizes = <T extends { active: boolean; sizes: unknown[] }>(offer: T) =>
  !offer.active || offer.sizes.length > 0;
const uniqueMl = (sizes: { ml: number }[]) => new Set(sizes.map((s) => s.ml)).size === sizes.length;

export const InspirationOfferSchema = z
  .object({ active: z.boolean(), sizes: z.array(PerfumeSizeSchema).max(10) })
  .refine(activeNeedsSizes, { message: 'Elige al menos un tamaño', path: ['sizes'] })
  .refine((o) => uniqueMl(o.sizes), { message: 'Hay tamaños repetidos', path: ['sizes'] });

export const PricedOfferSchema = z
  .object({ active: z.boolean(), sizes: z.array(PricedSizeSchema).max(10) })
  .refine(activeNeedsSizes, { message: 'Agrega al menos un tamaño con precio', path: ['sizes'] })
  .refine((o) => uniqueMl(o.sizes), { message: 'Hay tamaños repetidos', path: ['sizes'] });

export const OffersSchema = z
  .object({
    inspiracion: InspirationOfferSchema,
    replica: PricedOfferSchema,
    original: PricedOfferSchema,
  })
  .refine((o) => LINES.some((line) => o[line].active), {
    message: 'Activa al menos una línea (Inspiración, Réplica 1.1 u Original)',
    path: ['_'],
  });

export const PerfumeDocSchema = z.object({
  slug,
  /** Nombre de la fragancia (p. ej. "Delina"); la marca va en brandId. */
  name: trimmed(140).min(1),
  brandId: slug,
  description: trimmed(2000),
  gender: z.enum(GENDERS),
  house: z.enum(HOUSES),
  concentration: z.enum(CONCENTRATIONS).nullable(),
  olfactoryFamily: z.array(trimmed(40).min(1)).max(8),
  notes: z.object({
    top: z.array(trimmed(40).min(1)).max(12),
    heart: z.array(trimmed(40).min(1)).max(12),
    base: z.array(trimmed(40).min(1)).max(12),
  }),
  categoryIds: z.array(slug).max(10),
  /** Líneas en las que se ofrece el perfume, con sus tamaños y precios. */
  offers: OffersSchema,
  badges: z.array(z.enum(BADGES)).max(3),
  leadTime: trimmed(80).nullable(),
  images: z.array(PerfumeImageSchema).max(12),
  featured: z.boolean(),
  sortOrder: z.number().int(),
  status: z.enum(STATUSES),
  /** ISO 8601. */
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const BrandDocSchema = z.object({
  name: trimmed(80).min(1),
  slug,
  house: z.enum(HOUSES),
  /** Casa asignada por criterio general; pendiente de confirmar por el negocio. */
  housePending: z.boolean(),
});

export const CatalogSizeSchema = z.object({
  ml: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  note: trimmed(60),
});

export const SiteSettingsDocSchema = z.object({
  sizes: z.array(CatalogSizeSchema).min(1).max(10),
  whatsappNumber: z
    .string()
    .regex(/^\d{10,15}$/, 'Solo dígitos con indicativo, p. ej. 573001234567')
    .nullable(),
  announcementBar: z.object({ text: trimmed(140), active: z.boolean() }),
  updatedAt: z.iso.datetime(),
});

export type PerfumeDoc = z.infer<typeof PerfumeDocSchema>;
export type PerfumeImageDoc = z.infer<typeof PerfumeImageSchema>;
export type Line = (typeof LINES)[number];
export type OffersDoc = z.infer<typeof OffersSchema>;
export type PricedSizeDoc = z.infer<typeof PricedSizeSchema>;
export type BrandDoc = z.infer<typeof BrandDocSchema>;
export type SiteSettingsDoc = z.infer<typeof SiteSettingsDocSchema>;
export type CatalogSizeDoc = z.infer<typeof CatalogSizeSchema>;
