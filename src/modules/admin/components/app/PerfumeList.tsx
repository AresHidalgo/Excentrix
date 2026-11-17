/** @jsxImportSource react */
import { useEffect, useMemo, useState } from 'react';
import type { BrandDoc, PerfumeDoc } from '@modules/product/documents';
import { listBrands, listPerfumes } from '../../lib/repository';
import { Button, cloudinaryThumb, inputClass, Notice, Skeleton } from './ui';

const HOUSE_LABEL = { nicho: 'Nicho', disenador: 'Diseñador', arabe: 'Árabe' } as const;
const GENDER_LABEL = { hombre: 'Hombre', mujer: 'Mujer', unisex: 'Unisex' } as const;
const LINE_LABEL = {
  inspiracion: 'Inspiración',
  replica: 'Réplica 1.1',
  original: 'Original',
} as const;
type LineKey = keyof typeof LINE_LABEL;

/** Líneas activas del perfume, en orden. */
const activeLines = (p: PerfumeDoc): LineKey[] =>
  (Object.keys(LINE_LABEL) as LineKey[]).filter((line) => p.offers[line].active);
/** Solo inspiración: se muestra "Inspirado en …". */
const onlyInspiration = (p: PerfumeDoc) => {
  const lines = activeLines(p);
  return lines.length === 1 && lines[0] === 'inspiracion';
};

/** Perfumes por página: 10 en escritorio (tabla) y 5 en móvil (tarjetas). */
const PAGE_SIZE_DESKTOP = 10;
const PAGE_SIZE_MOBILE = 5;
const DESKTOP_QUERY = '(min-width: 768px)';

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setDesktop(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return desktop;
}

/** Miniatura 4:5 de la foto principal, o un recuadro vacío si el perfume no tiene fotos. */
function Thumb({ perfume }: { perfume: PerfumeDoc }) {
  const main = perfume.images[0];
  return main ? (
    <img
      src={cloudinaryThumb(main.url, 96)}
      alt=""
      width={40}
      height={50}
      loading="lazy"
      className="h-[50px] w-10 shrink-0 border border-line bg-white object-contain"
    />
  ) : (
    <span
      aria-hidden="true"
      className="block h-[50px] w-10 shrink-0 border border-dashed border-line bg-paper"
    />
  );
}

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
  const [line, setLine] = useState('');
  const [reload, setReload] = useState(0);
  const [page, setPage] = useState(1);
  const isDesktop = useIsDesktop();
  const PAGE_SIZE = isDesktop ? PAGE_SIZE_DESKTOP : PAGE_SIZE_MOBILE;

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
      if (line && !p.offers[line as LineKey].active) return false;
      return true;
    });
  }, [perfumes, brands, query, house, gender, status, line]);

  // Al cambiar la búsqueda o un filtro se vuelve a la primera página.
  useEffect(() => setPage(1), [query, house, gender, status, line, PAGE_SIZE]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const goTo = (n: number) => {
    setPage(Math.min(Math.max(1, n), pageCount));
    window.scrollTo({ top: 0 });
  };

  const clear = () => {
    setQuery('');
    setHouse('');
    setGender('');
    setStatus('');
    setLine('');
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
        <input
          type="search"
          placeholder="Buscar por perfume o marca"
          aria-label="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={inputClass}
        />
        <select
          aria-label="Línea"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          className={inputClass}
        >
          <option value="">Todas las líneas</option>
          {Object.entries(LINE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
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

      {filtered.length > 0 && !isDesktop && (
        <ul className="flex flex-col gap-3">
          {visible.map((p) => (
            <li key={p.slug}>
              <a
                href={`#/perfume/${encodeURIComponent(p.slug)}`}
                className="flex flex-col gap-2 border border-line bg-white p-4 active:bg-paper"
              >
                <span className="flex items-start justify-between gap-3">
                  <Thumb perfume={p} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">
                      {onlyInspiration(p) && <span className="text-ink-soft">Inspirado en </span>}
                      {p.name}
                    </span>
                    <span className="truncate text-xs text-ink-soft">
                      {brands.get(p.brandId)?.name ?? p.brandId}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 px-2 py-0.5 text-[10px] tracking-[0.12em] uppercase ${p.status === 'published' ? 'bg-ink text-white' : 'border border-line text-ink-soft'}`}
                  >
                    {p.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                </span>
                <span className="text-xs text-ink-soft">
                  {activeLines(p)
                    .map((l) => LINE_LABEL[l])
                    .join(' · ')}{' '}
                  · {HOUSE_LABEL[p.house]} ·{' '}
                  {p.images.length ? `${p.images.length} foto(s)` : 'Sin fotos'}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > 0 && isDesktop && (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-[11px] tracking-[0.12em] text-ink-soft uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Perfume</th>
                <th className="px-4 py-3 font-medium">Líneas</th>
                <th className="px-4 py-3 font-medium">Casa</th>
                <th className="px-4 py-3 font-medium">Género</th>
                <th className="px-4 py-3 font-medium">Fotos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.slug} className="border-b border-line last:border-b-0 hover:bg-paper">
                  <td className="px-4 py-3">
                    <a
                      href={`#/perfume/${encodeURIComponent(p.slug)}`}
                      className="flex items-center gap-3 hover:text-crimson"
                    >
                      <Thumb perfume={p} />
                      <span className="flex flex-col">
                        <span className="font-medium">
                          {onlyInspiration(p) && (
                            <span className="text-ink-soft">Inspirado en </span>
                          )}
                          {p.name}
                        </span>
                        <span className="text-xs text-ink-soft">
                          {brands.get(p.brandId)?.name ?? p.brandId}
                        </span>
                      </span>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {activeLines(p)
                      .map((l) => LINE_LABEL[l])
                      .join(' · ')}
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

      {filtered.length > PAGE_SIZE && (
        <nav
          aria-label="Paginación"
          className="flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <p className="text-ink-soft">
            {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              tone="outline"
              onClick={() => goTo(1)}
              disabled={currentPage === 1}
              aria-label="Primera página"
            >
              «
            </Button>
            <Button
              tone="outline"
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="px-1 text-ink sm:px-2" aria-current="page">
              Página {currentPage} de {pageCount}
            </span>
            <Button
              tone="outline"
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === pageCount}
            >
              Siguiente
            </Button>
            <Button
              tone="outline"
              onClick={() => goTo(pageCount)}
              disabled={currentPage === pageCount}
              aria-label="Última página"
            >
              »
            </Button>
          </div>
        </nav>
      )}
    </section>
  );
}
