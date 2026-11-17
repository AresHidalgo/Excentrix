import type { ContentPage } from '../schemas';

/** Páginas de contenido y confianza (PLAN §5). Envíos, términos y privacidad: textos base por confirmar con el negocio. */
const PAGES: ContentPage[] = [
  {
    slug: 'versiones',
    eyebrow: 'Guía',
    title: 'Inspiración, réplica 1.1 u original: ¿cuál elijo?',
    intro:
      'En Excentrix cada perfume puede ofrecerse en hasta tres versiones. Te contamos qué es cada una para que sepas exactamente qué recibes.',
    sections: [
      {
        heading: 'Inspiración',
        paragraphs: [
          'Una fragancia propia que evoca al perfume de referencia. No es el perfume ni el frasco de la marca. Viene en 30, 60 y 100 ml, con el mismo precio para todo el catálogo.',
        ],
      },
      {
        heading: 'Réplica 1.1',
        paragraphs: [
          'Una imitación del perfume y de su frasco. No es el perfume original ni el frasco original de la marca. Cada referencia tiene su propio precio.',
        ],
      },
      {
        heading: 'Original',
        paragraphs: [
          'El perfume original de la marca. Cada referencia tiene su propio precio y disponibilidad.',
        ],
      },
      {
        heading: '¿Cómo sé qué versión estoy comprando?',
        paragraphs: [
          'En la ficha de cada perfume eliges primero la versión y luego el tamaño. El mensaje de WhatsApp incluye la versión elegida, para que no haya confusiones.',
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
          'Elige la versión (inspiración, réplica 1.1 u original) y el tamaño. El precio cambia al instante según lo que elijas.',
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
