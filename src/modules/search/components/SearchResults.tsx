import { useEffect, useMemo, useState } from 'preact/hooks';
import { formatPrice } from '@shared/lib/format';

/** Datos mínimos de cada perfume para buscar en el navegador (se arman en el build). */
export interface SearchItem {
  slug: string;
  href: string;
  name: string;
  brand: string;
  /** Etiqueta superior: "Inspirado en · Marca" o la marca. */
  eyebrow: string;
  lines: string;
  gender: string;
  priceFrom: number | null;
  image: string | null;
}

interface Props {
  items: SearchItem[];
}

const PAGE_SIZE = 24;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ');
}

export default function SearchResults({ items }: Props) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  // La consulta vive en la URL (?q=) para poder compartirla y volver atrás.
  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get('q') ?? '');
  }, []);

  const index = useMemo(
    () =>
      items.map((item) => ({
        item,
        text: normalize(`${item.name} ${item.brand} ${item.lines} ${item.gender}`),
      })),
    [items],
  );

  const results = useMemo(() => {
    const words = normalize(query).split(' ').filter(Boolean);
    if (words.length === 0) return [];
    return index.filter(({ text }) => words.every((w) => text.includes(w))).map(({ item }) => item);
  }, [index, query]);

  function onInput(value: string) {
    setQuery(value);
    setLimit(PAGE_SIZE);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set('q', value);
    else url.searchParams.delete('q');
    window.history.replaceState(null, '', url);
  }

  const visible = results.slice(0, limit);

  return (
    <div class="flex flex-col gap-8">
      <label class="flex flex-col gap-2">
        <span class="eyebrow text-ink-soft">Buscar perfume o marca</span>
        <input
          type="search"
          value={query}
          onInput={(e) => onInput((e.target as HTMLInputElement).value)}
          placeholder="Ej.: Delina, Lattafa, Sauvage…"
          autoFocus
          class="w-full border-b border-ink bg-transparent py-3 font-display text-2xl outline-none placeholder:text-ink-soft/50 sm:text-3xl"
        />
      </label>

      <p class="text-sm text-ink-soft" aria-live="polite">
        {query.trim() === ''
          ? `Escribe para buscar entre ${items.length} perfumes.`
          : results.length === 0
            ? `No encontramos perfumes para “${query}”. Prueba con otra palabra o la marca.`
            : `${results.length} resultado${results.length === 1 ? '' : 's'} para “${query}”`}
      </p>

      {visible.length > 0 && (
        <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {visible.map((item) => (
            <li key={item.slug}>
              <a href={item.href} class="group flex h-full flex-col bg-white">
                <div class="aspect-[4/5] overflow-hidden bg-white">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      class="h-full w-full object-contain"
                    />
                  ) : (
                    <div class="grid h-full place-items-center text-ink-soft/30">
                      <svg viewBox="0 0 48 64" class="w-1/3" aria-hidden="true">
                        <rect x="17" y="2" width="14" height="9" rx="1.5" fill="currentColor" />
                        <rect x="6" y="16" width="36" height="46" rx="4" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>
                <div class="flex flex-1 flex-col gap-1.5 border-t border-line p-3 sm:p-4">
                  <span class="eyebrow truncate text-[10px] text-ink-soft">{item.eyebrow}</span>
                  <span class="font-display text-base leading-snug group-hover:underline group-hover:decoration-crimson sm:text-lg">
                    {item.name}
                  </span>
                  <span class="text-[10px] tracking-[0.12em] text-ink-soft uppercase">
                    {item.lines}
                  </span>
                  {item.priceFrom !== null && (
                    <span class="price mt-auto pt-1 text-sm">
                      <span class="text-xs text-ink-soft">Desde </span>
                      {formatPrice(item.priceFrom)}
                    </span>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      {results.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + PAGE_SIZE)}
          class="eyebrow self-center border border-ink px-8 py-4 text-ink transition-colors hover:bg-ink hover:text-white"
        >
          Ver más resultados
        </button>
      )}
    </div>
  );
}
