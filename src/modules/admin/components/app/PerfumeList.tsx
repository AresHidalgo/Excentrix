/** @jsxImportSource react */
import { useEffect, useMemo, useState } from 'react';
import type { BrandDoc, PerfumeDoc } from '@modules/product/documents';
import { listBrands, listPerfumes } from '../../lib/repository';
import { Button, inputClass, Notice, Skeleton } from './ui';

const HOUSE_LABEL = { nicho: 'Nicho', disenador: 'Diseñador', arabe: 'Árabe' } as const;
const GENDER_LABEL = { hombre: 'Hombre', mujer: 'Mujer', unisex: 'Unisex' } as const;

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function PerfumeList() {
  const [perfumes, setPerfumes] = useState<PerfumeDoc[] | null>(null);
  const [brands, setBrands] = useState<Map<string, BrandDoc>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [house, setHouse] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    setError(null);
    setPerfumes(null);
    Promise.all([listPerfumes(), listBrands()])
      .then(([p, b]) => {
        if (!alive) return;
        setPerfumes(p);
        setBrands(new Map(b.map((x) => [x.id, x])));
      })
      .catch(() => alive && setError('No pudimos cargar el catálogo. Revisa tu conexión.'));
    return () => {
      alive = false;
    };
  }, [reload]);

  const filtered = useMemo(() => {
    if (!perfumes) return [];
    const q = normalize(query.trim());
    return perfumes.filter((p) => {
      const brand = brands.get(p.brandId)?.name ?? p.brandId;
      if (q && !normalize(`${p.name} ${brand}`).includes(q)) return false;
      if (house && p.house !== house) return false;
      if (gender && p.gender !== gender) return false;
      if (status && p.status !== status) return false;
      return true;
    });
  }, [perfumes, brands, query, house, gender, status]);

  const clear = () => {
    setQuery('');
    setHouse('');
    setGender('');
    setStatus('');
  };

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl">Perfumes</h1>
          <p className="text-sm text-ink-soft">
            {perfumes ? `${filtered.length} de ${perfumes.length}` : 'Cargando catálogo…'}
          </p>
        </div>
        <Button tone="accent" onClick={() => (window.location.hash = '#/nuevo')}>
          Nuevo perfume
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <input
          type="search"
          placeholder="Buscar por perfume o marca"
          aria-label="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={inputClass}
        />
        <select
          aria-label="Casa"
          value={house}
          onChange={(e) => setHouse(e.target.value)}
          className={inputClass}
        >
          <option value="">Todas las casas</option>
          {Object.entries(HOUSE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Género"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className={inputClass}
        >
          <option value="">Todos los géneros</option>
          {Object.entries(GENDER_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Estado"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={inputClass}
        >
          <option value="">Publicados y borradores</option>
          <option value="published">Publicados</option>
          <option value="draft">Borradores</option>
        </select>
      </div>

      {error && (
        <Notice tone="error">
          {error}{' '}
          <button type="button" className="underline" onClick={() => setReload((n) => n + 1)}>
            Reintentar
          </button>
        </Notice>
      )}
      {!perfumes && !error && <Skeleton rows={8} />}
      {perfumes && filtered.length === 0 && (
        <Notice>
          No hay perfumes con esos filtros.{' '}
          <button type="button" className="underline" onClick={clear}>
            Limpiar filtros
          </button>
        </Notice>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-[11px] tracking-[0.12em] text-ink-soft uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Perfume</th>
                <th className="px-4 py-3 font-medium">Casa</th>
                <th className="px-4 py-3 font-medium">Género</th>
                <th className="px-4 py-3 font-medium">Fotos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.slug} className="border-b border-line last:border-b-0 hover:bg-paper">
                  <td className="px-4 py-3">
                    <a
                      href={`#/perfume/${encodeURIComponent(p.slug)}`}
                      className="flex flex-col hover:text-crimson"
                    >
                      <span className="font-medium">
                        {p.inspired && <span className="text-ink-soft">Inspirado en </span>}
                        {p.name}
                      </span>
                      <span className="text-xs text-ink-soft">
                        {brands.get(p.brandId)?.name ?? p.brandId}
                      </span>
                    </a>
                  </td>
                  <td className="px-4 py-3">{HOUSE_LABEL[p.house]}</td>
                  <td className="px-4 py-3">{GENDER_LABEL[p.gender]}</td>
                  <td className="px-4 py-3">{p.images.length || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] tracking-[0.12em] uppercase ${p.status === 'published' ? 'bg-ink text-white' : 'border border-line text-ink-soft'}`}
                    >
                      {p.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
