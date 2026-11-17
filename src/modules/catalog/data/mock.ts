import type { Perfume, Variant } from '@modules/product';
import type { Brand, Category } from '../schemas';

/**
 * Datos de ejemplo para las maquetas (fase 1). En la fase 3 estas funciones se reemplazan por
 * lecturas de Firestore en el build con la misma firma, así los componentes no cambian.
 * Nombres y marcas reales como contenido de muestra; precios en COP plausibles, no definitivos.
 */

function variant(
  id: string,
  type: Variant['type'],
  ml: number,
  price: number,
  extra: Partial<Pick<Variant, 'compareAtPrice' | 'available' | 'condition'>> = {},
): Variant {
  return {
    line: 'original',
    id,
    type,
    ml,
    price,
    compareAtPrice: extra.compareAtPrice ?? null,
    available: extra.available ?? true,
    ...(type === 'frasco' ? { condition: extra.condition ?? 'nuevo' } : {}),
  };
}

function decants(p3: number, p5: number, p10: number, available = true): Variant[] {
  return [
    variant('d3', 'decant', 3, p3, { available }),
    variant('d5', 'decant', 5, p5, { available }),
    variant('d10', 'decant', 10, p10, { available }),
  ];
}

const BRANDS: Brand[] = [
  { id: 'lattafa', name: 'Lattafa', slug: 'lattafa', country: 'Emiratos Árabes Unidos' },
  { id: 'rasasi', name: 'Rasasi', slug: 'rasasi', country: 'Emiratos Árabes Unidos' },
  { id: 'armaf', name: 'Armaf', slug: 'armaf', country: 'Emiratos Árabes Unidos' },
  { id: 'dior', name: 'Dior', slug: 'dior', country: 'Francia' },
  { id: 'ysl', name: 'Yves Saint Laurent', slug: 'yves-saint-laurent', country: 'Francia' },
  { id: 'valentino', name: 'Valentino', slug: 'valentino', country: 'Italia' },
  { id: 'pdm', name: 'Parfums de Marly', slug: 'parfums-de-marly', country: 'Francia' },
  { id: 'mfk', name: 'Maison Francis Kurkdjian', slug: 'maison-francis-kurkdjian' },
  { id: 'xerjoff', name: 'Xerjoff', slug: 'xerjoff', country: 'Italia' },
  { id: 'kilian', name: 'Kilian Paris', slug: 'kilian-paris', country: 'Francia' },
  { id: 'mancera', name: 'Mancera', slug: 'mancera', country: 'Francia' },
];

const brandName = (id: string) => BRANDS.find((b) => b.id === id)?.name ?? id;

type PerfumeSeed = Omit<Perfume, 'brand' | 'images' | 'id' | 'categoryIds' | 'lines'> &
  Partial<Pick<Perfume, 'categoryIds'>>;

const SEEDS: PerfumeSeed[] = [
  {
    name: 'Khamrah',
    slug: 'khamrah-lattafa',
    brandId: 'lattafa',
    description:
      'Un ámbar especiado y goloso: canela y dátiles sobre una base cálida de vainilla y praliné. Ideal para noches frías y para quien quiere dejar estela.',
    gender: 'unisex',
    concentration: 'EDP',
    olfactoryFamily: ['ámbar', 'especiado', 'gourmand'],
    notes: {
      top: ['canela', 'nuez moscada', 'bergamota'],
      heart: ['dátiles', 'praliné', 'nardo'],
      base: ['vainilla', 'haba tonka', 'ámbar', 'mirra'],
    },
    house: 'arabe',
    variants: [...decants(14999, 21999, 36999), variant('f100', 'frasco', 100, 219000)],
    badges: ['nuevo'],
    leadTime: null,
    featured: true,
    sortOrder: 1,
    createdAt: '2026-11-08',
    shape: 'oud',
  },
  {
    name: 'Asad',
    slug: 'asad-lattafa',
    brandId: 'lattafa',
    description:
      'Pimienta negra, tabaco y café envueltos en vainilla y ámbar. Intenso y masculino, con una proyección que no pasa desapercibida.',
    gender: 'hombre',
    concentration: 'EDP',
    olfactoryFamily: ['ámbar', 'especiado'],
    notes: {
      top: ['pimienta negra', 'tabaco', 'piña'],
      heart: ['pachulí', 'café', 'iris'],
      base: ['vainilla', 'ámbar', 'benjuí', 'ládano'],
    },
    house: 'arabe',
    variants: [
      ...decants(12999, 18999, 31999),
      variant('f100', 'frasco', 100, 179000, { compareAtPrice: 199000 }),
    ],
    badges: [],
    leadTime: null,
    featured: true,
    sortOrder: 2,
    createdAt: '2026-09-20',
    shape: 'faceted',
  },
  {
    name: 'Hawas for Him',
    slug: 'hawas-for-him-rasasi',
    brandId: 'rasasi',
    description:
      'Fresco y acuático con un giro afrutado de manzana y ciruela. Un perfume de día, limpio y versátil para climas cálidos.',
    gender: 'hombre',
    concentration: 'EDP',
    olfactoryFamily: ['acuático', 'fresco', 'afrutado'],
    notes: {
      top: ['manzana', 'bergamota', 'limón', 'canela'],
      heart: ['notas acuáticas', 'ciruela', 'cardamomo', 'azahar'],
      base: ['ámbar gris', 'almizcle', 'pachulí', 'madera flotante'],
    },
    house: 'arabe',
    variants: [
      ...decants(13999, 19999, 34999),
      variant('f100', 'frasco', 100, 239000, { available: false }),
    ],
    badges: [],
    leadTime: null,
    featured: false,
    sortOrder: 5,
    createdAt: '2026-08-02',
    shape: 'tall',
  },
  {
    name: 'Club de Nuit Intense Man',
    slug: 'club-de-nuit-intense-man-armaf',
    brandId: 'armaf',
    description:
      'Cítricos ahumados, piña y abedul sobre almizcle y ámbar gris. Un clásico árabe de gran rendimiento para todos los días.',
    gender: 'hombre',
    concentration: 'EDT',
    olfactoryFamily: ['amaderado', 'afrutado', 'ahumado'],
    notes: {
      top: ['limón', 'piña', 'grosella negra', 'manzana', 'bergamota'],
      heart: ['abedul', 'jazmín', 'rosa'],
      base: ['almizcle', 'ámbar gris', 'pachulí', 'vainilla'],
    },
    house: 'arabe',
    variants: [
      ...decants(11999, 16999, 28999),
      variant('f105', 'frasco', 105, 159000, { condition: 'tester' }),
    ],
    badges: [],
    leadTime: null,
    featured: false,
    sortOrder: 6,
    createdAt: '2026-07-15',
    shape: 'tall',
  },
  {
    name: 'Sauvage',
    slug: 'sauvage-eau-de-parfum-dior',
    brandId: 'dior',
    description:
      'Bergamota jugosa y ambroxan con un fondo suave de vainilla. La versión Eau de Parfum del icono de Dior: más redonda y envolvente.',
    gender: 'hombre',
    concentration: 'EDP',
    olfactoryFamily: ['aromático', 'fresco', 'amaderado'],
    notes: {
      top: ['bergamota'],
      heart: ['pimienta de Sichuan', 'lavanda', 'anís estrellado', 'nuez moscada'],
      base: ['ambroxan', 'vainilla'],
    },
    house: 'disenador',
    variants: [...decants(24999, 36999, 64999), variant('f100', 'frasco', 100, 689000)],
    badges: [],
    leadTime: null,
    featured: true,
    sortOrder: 3,
    createdAt: '2026-06-10',
    shape: 'tall',
  },
  {
    name: 'Libre',
    slug: 'libre-eau-de-parfum-ysl',
    brandId: 'ysl',
    description:
      'La tensión entre la lavanda francesa y el azahar marroquí, con un fondo de vainilla de Madagascar. Elegante, luminoso y con carácter.',
    gender: 'mujer',
    concentration: 'EDP',
    olfactoryFamily: ['floral', 'aromático', 'ámbar'],
    notes: {
      top: ['lavanda', 'mandarina', 'grosella negra'],
      heart: ['lavanda', 'azahar', 'jazmín'],
      base: ['vainilla de Madagascar', 'almizcle', 'cedro', 'ámbar gris'],
    },
    house: 'disenador',
    variants: [
      ...decants(23999, 34999, 59999),
      variant('f90', 'frasco', 90, 579000, { compareAtPrice: 649000 }),
    ],
    badges: ['nuevo'],
    leadTime: null,
    featured: true,
    sortOrder: 4,
    createdAt: '2026-11-01',
    shape: 'round',
  },
  {
    name: 'Born in Roma Donna',
    slug: 'born-in-roma-donna-valentino',
    brandId: 'valentino',
    description:
      'Jazmín en tres versiones sobre vainilla bourbon y maderas suaves. Femenino y moderno, solo en decant para probarlo antes de decidir.',
    gender: 'mujer',
    concentration: 'EDP',
    olfactoryFamily: ['floral', 'gourmand'],
    notes: {
      top: ['grosella negra', 'pimienta rosa', 'bergamota'],
      heart: ['jazmín', 'jazmín sambac', 'té de jazmín'],
      base: ['vainilla bourbon', 'cachemira', 'guayaco'],
    },
    house: 'disenador',
    variants: decants(22999, 32999, 56999),
    badges: ['nuevo'],
    leadTime: null,
    featured: false,
    sortOrder: 7,
    createdAt: '2026-10-25',
    shape: 'faceted',
  },
  {
    name: 'Layton',
    slug: 'layton-parfums-de-marly',
    brandId: 'pdm',
    description:
      'Manzana, lavanda y vainilla con un fondo especiado de cardamomo y pachulí. Uno de los nichos más queridos: elegante, cálido y muy versátil.',
    gender: 'hombre',
    concentration: 'EDP',
    olfactoryFamily: ['ámbar', 'floral', 'especiado'],
    notes: {
      top: ['manzana', 'lavanda', 'bergamota', 'mandarina'],
      heart: ['geranio', 'violeta', 'jazmín'],
      base: ['vainilla', 'cardamomo', 'pimienta', 'pachulí', 'guayaco'],
    },
    house: 'nicho',
    variants: [...decants(34999, 52999, 94999), variant('f125', 'frasco', 125, 1290000)],
    badges: [],
    leadTime: null,
    featured: true,
    sortOrder: 8,
    createdAt: '2026-05-30',
    shape: 'round',
  },
  {
    name: 'Baccarat Rouge 540',
    slug: 'baccarat-rouge-540-mfk',
    brandId: 'mfk',
    description:
      'Azafrán y jazmín sobre madera de ámbar y resina de abeto. Una firma luminosa y mineral que se reconoce al instante. Lo traemos bajo pedido.',
    gender: 'unisex',
    concentration: 'EDP',
    olfactoryFamily: ['ámbar', 'floral', 'amaderado'],
    notes: {
      top: ['azafrán', 'jazmín'],
      heart: ['madera de ámbar', 'ámbar gris'],
      base: ['resina de abeto', 'cedro'],
    },
    house: 'nicho',
    variants: [variant('f70', 'frasco', 70, 1590000)],
    badges: ['bajo-encargo'],
    leadTime: '8 a 15 días hábiles',
    featured: true,
    sortOrder: 9,
    createdAt: '2026-04-12',
    shape: 'faceted',
  },
  {
    name: 'Naxos',
    slug: 'naxos-xerjoff',
    brandId: 'xerjoff',
    description:
      'Lavanda y cítricos que dan paso a miel, tabaco y haba tonka. Un homenaje a Sicilia: dulce, aromático y muy refinado.',
    gender: 'unisex',
    concentration: 'EDP',
    olfactoryFamily: ['aromático', 'tabaco', 'dulce'],
    notes: {
      top: ['lavanda', 'bergamota', 'limón'],
      heart: ['miel', 'canela', 'cachemira', 'jazmín'],
      base: ['hoja de tabaco', 'haba tonka', 'vainilla'],
    },
    house: 'nicho',
    variants: [
      ...decants(39999, 59999, 109999, false),
      variant('f100', 'frasco', 100, 1150000, { available: false }),
    ],
    badges: [],
    leadTime: null,
    featured: false,
    sortOrder: 10,
    createdAt: '2026-03-03',
    shape: 'oud',
  },
  {
    name: "Angels' Share",
    slug: 'angels-share-kilian',
    brandId: 'kilian',
    description:
      'Coñac, canela y roble tostado sobre praliné y vainilla. Cálido y licoroso, como un postre servido en copa. En preventa: llega en pocos días.',
    gender: 'unisex',
    concentration: 'EDP',
    olfactoryFamily: ['gourmand', 'amaderado', 'especiado'],
    notes: {
      top: ['coñac'],
      heart: ['canela', 'haba tonka', 'roble'],
      base: ['praliné', 'vainilla', 'sándalo'],
    },
    house: 'nicho',
    variants: [...decants(36999, 54999, 99999), variant('f50', 'frasco', 50, 1090000)],
    badges: ['preventa'],
    leadTime: 'llega la semana del 1 de diciembre',
    featured: false,
    sortOrder: 11,
    createdAt: '2026-11-12',
    shape: 'round',
  },
  {
    name: 'Cedrat Boisé',
    slug: 'cedrat-boise-mancera',
    brandId: 'mancera',
    description:
      'Cidra y limón siciliano sobre cuero, sándalo y musgo. Fresco al inicio y amaderado al final, con una duración sobresaliente.',
    gender: 'unisex',
    concentration: 'EDP',
    olfactoryFamily: ['cítrico', 'amaderado', 'cuero'],
    notes: {
      top: ['cidra', 'limón siciliano', 'grosella negra', 'especias'],
      heart: ['frutas', 'hoja de pachulí', 'jazmín'],
      base: ['cuero', 'sándalo', 'vainilla', 'almizcle blanco', 'musgo'],
    },
    house: 'nicho',
    variants: [
      variant('d3', 'decant', 3, 19999, { compareAtPrice: 22999 }),
      variant('d5', 'decant', 5, 28999, { compareAtPrice: 32999 }),
      variant('d10', 'decant', 10, 49999, { compareAtPrice: 56999 }),
      variant('f120', 'frasco', 120, 549000),
    ],
    badges: [],
    leadTime: null,
    featured: false,
    sortOrder: 12,
    createdAt: '2026-02-18',
    shape: 'tall',
  },
  {
    name: 'Libre · Set de regalo',
    slug: 'libre-set-de-regalo-ysl',
    brandId: 'ysl',
    description:
      'Estuche con Libre Eau de Parfum de 50 ml y una miniatura de viaje. Listo para regalar, con la caja original de la marca.',
    gender: 'mujer',
    concentration: 'EDP',
    olfactoryFamily: ['floral', 'aromático'],
    notes: {
      top: ['lavanda', 'mandarina', 'grosella negra'],
      heart: ['lavanda', 'azahar', 'jazmín'],
      base: ['vainilla de Madagascar', 'almizcle', 'cedro', 'ámbar gris'],
    },
    house: 'disenador',
    categoryIds: ['sets'],
    variants: [variant('f50', 'frasco', 50, 469000)],
    badges: [],
    leadTime: null,
    featured: false,
    sortOrder: 13,
    createdAt: '2026-10-05',
    shape: 'round',
  },
];

const PERFUMES: Perfume[] = SEEDS.map((seed, i) => ({
  ...seed,
  id: `p${String(i + 1).padStart(2, '0')}`,
  brand: brandName(seed.brandId),
  categoryIds: seed.categoryIds ?? [],
  images: [],
  // Los datos de muestra son productos originales (guía de estilo y maqueta del admin).
  lines: ['original'],
}));

/** Secciones del menú decidido (PLAN §4, "Menú inicial"). */
const CATEGORIES: Category[] = [
  {
    id: 'inspiraciones',
    name: 'Inspiraciones',
    slug: 'inspiraciones',
    description:
      'Fragancias inspiradas en los grandes perfumes, en 30, 60 y 100 ml a precio fijo. No son el perfume ni el frasco de la marca.',
    parentId: null,
    showInMenu: true,
    menuOrder: -3,
    rule: 'auto',
  },
  {
    id: 'replicas-1-1',
    name: 'Réplicas 1.1',
    slug: 'replicas-1-1',
    description:
      'Imitación del perfume y de su frasco. No es el perfume original ni el frasco original de la marca.',
    parentId: null,
    showInMenu: true,
    menuOrder: -2,
    rule: 'auto',
  },
  {
    id: 'originales',
    name: 'Originales',
    slug: 'originales',
    description: 'El perfume original de la marca.',
    parentId: null,
    showInMenu: true,
    menuOrder: -1,
    rule: 'auto',
  },
  {
    id: 'nuevos-lanzamientos',
    name: 'Nuevos',
    slug: 'nuevos-lanzamientos',
    description: 'Lo último que llegó a Excentrix, recién salido de la caja.',
    parentId: null,
    showInMenu: true,
    menuOrder: 1,
    rule: 'auto',
  },
  {
    id: 'ofertas',
    name: 'Ofertas',
    slug: 'ofertas',
    description: 'Perfumes con precio especial por tiempo limitado.',
    parentId: null,
    showInMenu: true,
    menuOrder: 2,
    rule: 'auto',
  },
  {
    id: 'genero',
    name: 'Género',
    slug: 'genero',
    description: '',
    parentId: null,
    showInMenu: true,
    menuOrder: 3,
    rule: 'auto',
  },
  {
    id: 'hombre',
    name: 'Hombre',
    slug: 'hombre',
    description: 'Fragancias masculinas: frescas, amaderadas, especiadas y de noche.',
    parentId: 'genero',
    showInMenu: true,
    menuOrder: 1,
    rule: 'auto',
  },
  {
    id: 'mujer',
    name: 'Mujer',
    slug: 'mujer',
    description: 'Fragancias femeninas: florales, gourmand y luminosas.',
    parentId: 'genero',
    showInMenu: true,
    menuOrder: 2,
    rule: 'auto',
  },
  {
    id: 'unisex',
    name: 'Unisex',
    slug: 'unisex',
    description: 'Perfumes sin etiqueta, para quien los quiera llevar.',
    parentId: 'genero',
    showInMenu: true,
    menuOrder: 3,
    rule: 'auto',
  },
  {
    id: 'nicho',
    name: 'Nicho',
    slug: 'nicho',
    description: 'Casas de autor y producción limitada, lejos de lo masivo.',
    parentId: null,
    showInMenu: true,
    menuOrder: 4,
    rule: 'manual',
  },
  {
    id: 'disenador',
    name: 'Diseñador',
    slug: 'disenador',
    description: 'Los clásicos de las grandes casas de moda.',
    parentId: null,
    showInMenu: true,
    menuOrder: 5,
    rule: 'manual',
  },
  {
    id: 'arabe',
    name: 'Árabe',
    slug: 'arabe',
    description: 'Ámbar, oud y especias de las casas de Emiratos, con gran rendimiento.',
    parentId: null,
    showInMenu: true,
    menuOrder: 6,
    rule: 'manual',
  },
  {
    id: 'decants',
    name: 'Decants',
    slug: 'decants',
    description: 'Prueba antes de comprar el frasco: 3, 5 y 10 ml del perfume original.',
    parentId: null,
    showInMenu: true,
    menuOrder: 7,
    rule: 'auto',
  },
  {
    id: 'sets',
    name: 'Sets',
    slug: 'sets',
    description: 'Estuches y combinaciones listas para regalar.',
    parentId: null,
    showInMenu: true,
    menuOrder: 8,
    rule: 'manual',
  },
  {
    id: 'bajo-encargo',
    name: 'Bajo encargo',
    slug: 'bajo-encargo',
    description: 'Lo traemos para ti. Tiempo estimado de entrega indicado en cada perfume.',
    parentId: null,
    showInMenu: true,
    menuOrder: 9,
    rule: 'auto',
  },
];

export function getMockPerfumes(): Perfume[] {
  return PERFUMES;
}

export function getMockPerfumeBySlug(slug: string): Perfume | undefined {
  return PERFUMES.find((p) => p.slug === slug);
}

export function getMockCategories(): Category[] {
  return CATEGORIES;
}

export function getMockBrands(): Brand[] {
  return BRANDS;
}
