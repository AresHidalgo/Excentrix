export type {
  CollectionTile,
  ContentPage,
  ContentSection,
  GenderTile,
  SiteSettings,
} from './schemas';
export { getMockPages } from './data/pages';
export { getMockSettings } from './data/settings';
export { default as StoreLayout } from './layouts/StoreLayout.astro';
export { default as ContentArticle } from './components/ContentArticle.astro';
export { default as BrandStrip } from './components/home/BrandStrip.astro';
export { default as CollectionTiles } from './components/home/CollectionTiles.astro';
export { default as DecantExplainer } from './components/home/DecantExplainer.astro';
export { default as GenderTiles } from './components/home/GenderTiles.astro';
export { default as HomeHero } from './components/home/HomeHero.astro';
export { default as HowToBuy } from './components/home/HowToBuy.astro';
export { default as InstagramStrip } from './components/home/InstagramStrip.astro';
export { default as LoyaltyCard } from './components/home/LoyaltyCard.astro';
export { default as PrestigeCollection } from './components/home/PrestigeCollection.astro';
export { default as NewArrivals } from './components/home/NewArrivals.astro';
