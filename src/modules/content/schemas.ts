/** Tipos del módulo de contenido. Zod llega en la fase 2. */

export interface SiteSettings {
  announcementBar: { text: string; active: boolean };
  social: { instagram: string; tiktok: string; handle: string };
}

export interface ContentSection {
  heading: string;
  paragraphs: string[];
}

export interface ContentPage {
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: ContentSection[];
}

export interface CollectionTile {
  title: string;
  description: string;
  href: string;
  count: number;
}

export interface GenderTile {
  title: string;
  href: string;
  count: number;
  shape: import('@modules/product').BottleShape;
}
