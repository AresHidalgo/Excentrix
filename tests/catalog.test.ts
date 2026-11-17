import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFacetGroups,
  EMPTY_FILTERS,
  matchesFilters,
} from '../src/modules/catalog/lib/filters';
import type { FacetItem } from '../src/modules/catalog/schemas';
import { formatPrice } from '../src/shared/lib/format';

/*
 * Catálogo desde archivo: estas pruebas corren sin credenciales de Firebase, así que
 * src/modules/catalog/data/catalog.ts usa catalogo.json / marcas.json.
 */
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
const { countCollection, getCatalogSource, getCategories, getPerfumes } =
  await import('../src/modules/catalog/data/catalog');

describe('Catálogo (fuente archivo)', () => {
  const perfumes = getPerfumes();

  it('usa los archivos cuando no hay credenciales', () => {
    assert.equal(getCatalogSource(), 'archivo');
  });
  it('tiene los 481 perfumes con URL única', () => {
    assert.equal(perfumes.length, 481);
    assert.equal(new Set(perfumes.map((p) => p.slug)).size, 481);
  });
  it('cada perfume es inspiración con 30, 60 y 100 ml', () => {
    for (const p of perfumes) {
      assert.deepEqual(p.lines, ['inspiracion']);
      assert.equal(p.inspired, true);
      assert.deepEqual(
        p.variants.map((v) => [v.line, v.ml, v.price]),
        [
          ['inspiracion', 30, 30000],
          ['inspiracion', 60, 60000],
          ['inspiracion', 100, 100000],
        ],
      );
    }
  });
  it('las colecciones por género suman el total', () => {
    const total = countCollection('hombre') + countCollection('mujer') + countCollection('unisex');
    assert.equal(total, perfumes.length);
  });
  it('el menú oculta líneas sin perfumes', () => {
    const menu = new Map(getCategories().map((c) => [c.slug, c.showInMenu]));
    assert.equal(menu.get('inspiraciones'), true);
    assert.equal(menu.get('replicas-1-1'), false);
    assert.equal(menu.get('originales'), false);
  });
});

describe('Filtros', () => {
  const base: FacetItem = {
    slug: 'a',
    gender: 'mujer',
    brand: 'Lattafa',
    families: [],
    lines: ['inspiracion'],
    presentations: ['frasco'],
    sizes: [30, 60, 100],
    priceFrom: 30000,
    available: true,
    featured: false,
    sortOrder: 0,
    createdAt: '2026-01-01',
  };
  const items: FacetItem[] = [
    base,
    { ...base, slug: 'b', gender: 'hombre', brand: 'Dior', lines: ['replica', 'original'] },
  ];

  it('sin filtros, todo coincide', () => {
    assert.equal(items.filter((i) => matchesFilters(i, EMPTY_FILTERS)).length, 2);
  });
  it('filtra por versión', () => {
    const state = { ...EMPTY_FILTERS, lines: ['replica'] };
    assert.deepEqual(
      items.filter((i) => matchesFilters(i, state)).map((i) => i.slug),
      ['b'],
    );
  });
  it('Y entre filtros distintos', () => {
    const state = { ...EMPTY_FILTERS, genders: ['mujer'], lines: ['original'] };
    assert.equal(items.filter((i) => matchesFilters(i, state)).length, 0);
  });
  it('el grupo Versión aparece con sus etiquetas', () => {
    const versiones = buildFacetGroups(items).find((g) => g.key === 'lines');
    assert.deepEqual(
      versiones?.options.map((o) => o.label),
      ['Inspiración', 'Réplica 1.1', 'Original'],
    );
  });
});

describe('formatPrice', () => {
  it('pesos colombianos sin decimales', () => {
    assert.equal(formatPrice(49999).replace(/\u00A0/g, ' '), '$ 49.999');
  });
});
