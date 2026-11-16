import type { ContentPage } from '../schemas';

/** Páginas de contenido y confianza (PLAN §5). Textos de muestra para las maquetas. */
const PAGES: ContentPage[] = [
  {
    slug: 'que-es-un-decant',
    eyebrow: 'Guía',
    title: '¿Qué es un decant?',
    intro:
      'Un decant es una porción del perfume original, trasvasada del frasco de la marca a un atomizador pequeño. Es la forma más sencilla de probar un perfume en tu piel antes de comprar el frasco completo.',
    sections: [
      {
        heading: 'Es el mismo perfume',
        paragraphs: [
          'Tomamos el líquido directamente del frasco original, con jeringa y atomizadores de vidrio limpios. No se diluye ni se mezcla: es exactamente la misma fragancia.',
        ],
      },
      {
        heading: '¿Cuánto me dura?',
        paragraphs: [
          'Cada mililitro rinde unas 12 a 15 atomizaciones. Un decant de 3 ml alcanza para una o dos semanas de uso diario; uno de 10 ml, para un poco más de un mes.',
        ],
      },
      {
        heading: '¿Por qué comprar decants?',
        paragraphs: [
          'Para conocer perfumes de nicho sin pagar el frasco completo, para llevar en el bolso o de viaje, o para tener varias fragancias y alternarlas según la ocasión.',
        ],
      },
    ],
  },
  {
    slug: 'como-comprar',
    eyebrow: 'Ayuda',
    title: 'Cómo comprar',
    intro:
      'Compras directo con nosotros por WhatsApp, sin registros ni carritos. Un perfume a la vez, o varios en la misma conversación.',
    sections: [
      {
        heading: '1. Elige tu perfume',
        paragraphs: ['Explora por colección, género o marca y entra a la ficha del perfume.'],
      },
      {
        heading: '2. Escoge la presentación',
        paragraphs: [
          'Decant de 3, 5 o 10 ml, o el frasco completo. El precio cambia al instante según lo que elijas.',
        ],
      },
      {
        heading: '3. Escríbenos por WhatsApp',
        paragraphs: [
          'Al pulsar "Comprar por WhatsApp" se abre la conversación con tu pedido ya escrito. Allí acordamos el pago y el envío.',
        ],
      },
    ],
  },
  {
    slug: 'envios',
    eyebrow: 'Ayuda',
    title: 'Envíos',
    intro: 'Enviamos a toda Colombia. Los detalles de costo y tiempo se confirman por WhatsApp.',
    sections: [
      {
        heading: 'Tiempos de entrega',
        paragraphs: [
          'Perfumes disponibles: de 1 a 3 días hábiles en ciudades principales y de 3 a 6 días en el resto del país. Bajo encargo y preventa: el tiempo indicado en cada perfume.',
        ],
      },
      {
        heading: 'Envío gratis',
        paragraphs: ['Por compras desde $179.999 el envío es gratis a cualquier ciudad.'],
      },
    ],
  },
  {
    slug: 'terminos',
    eyebrow: 'Legal',
    title: 'Términos y condiciones',
    intro: 'Texto de muestra. Los términos definitivos se publicarán antes del lanzamiento.',
    sections: [
      {
        heading: 'Precios y disponibilidad',
        paragraphs: [
          'Los precios están en pesos colombianos (COP) e incluyen impuestos. La disponibilidad se confirma al momento de cerrar la compra por WhatsApp.',
        ],
      },
    ],
  },
  {
    slug: 'privacidad',
    eyebrow: 'Legal',
    title: 'Política de privacidad',
    intro: 'Texto de muestra. La política definitiva se publicará antes del lanzamiento.',
    sections: [
      {
        heading: 'Datos que recogemos',
        paragraphs: [
          'Este sitio no tiene cuentas de cliente. Solo medimos visitas de forma anónima; los datos de tu pedido los compartes tú directamente en WhatsApp.',
        ],
      },
    ],
  },
];

export function getMockPages(): ContentPage[] {
  return PAGES;
}
