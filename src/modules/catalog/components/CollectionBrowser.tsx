import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import Icon from '@shared/ui/Icon.tsx';
import { buttonClass } from '@shared/ui/styles';
import type { FacetItem, FilterState, SortKey } from '../schemas';
import {
  buildFacetGroups,
  countActiveFilters,
  EMPTY_FILTERS,
  matchesFilters,
} from '../lib/filters';
import { SORT_OPTIONS, sortItems } from '../lib/sorting';

interface Props {
  items: FacetItem[];
  /** Grilla estática renderizada en el servidor (slot por defecto). */
  children?: ComponentChildren;
  /** Estado vacío estático (slot "empty"). */
  empty?: ComponentChildren;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, [tabindex]';

/**
 * Filtros y orden 100 % en el navegador sobre la grilla ya renderizada: oculta y reordena las
 * tarjetas (atributo hidden + CSS order) sin volver a dibujarlas. Escritorio: barra lateral.
 * Móvil: panel inferior con foco atrapado y cierre con Escape.
 */
export default function CollectionBrowser({ items, children, empty }: Props) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('destacados');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const groups = useMemo(() => buildFacetGroups(items), [items]);
  const visible = useMemo(
    () =>
      sortItems(
        items.filter((item) => matchesFilters(item, filters)),
        sort,
      ),
    [items, filters, sort],
  );
  const active = countActiveFilters(filters);
  const hasFilters = groups.length > 0;

  useEffect(() => {
    const order = new Map(visible.map((item, index) => [item.slug, index]));
    rootRef.current?.querySelectorAll<HTMLElement>('[data-slug]').forEach((card) => {
      const index = order.get(card.dataset.slug ?? '');
      card.hidden = index === undefined;
      card.style.order = index === undefined ? '' : String(index);
    });
  }, [visible]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    document.documentElement.style.overflow = 'hidden';
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab' || !panel) return;
      const nodes = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
      trigger?.focus();
    };
  }, [open]);

  const toggle = (key: keyof FilterState, value: string) =>
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));

  const clear = () => setFilters(EMPTY_FILTERS);

  const onRootClick = (event: MouseEvent) => {
    if ((event.target as Element | null)?.closest('[data-clear-filters]')) clear();
  };

  return (
    <div ref={rootRef} onClick={onRootClick}>
      <div class="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4">
        <p class="text-sm text-ink-soft" aria-live="polite">
          <span class="price text-ink">{visible.length}</span> de {items.length}
          <span class="sr-only sm:not-sr-only"> {items.length === 1 ? 'perfume' : 'perfumes'}</span>
        </p>
        <div class="flex items-center gap-2 sm:gap-4">
          {hasFilters && (
            <button
              ref={triggerRef}
              type="button"
              class={buttonClass('outline', 'sm', 'lg:hidden')}
              aria-expanded={open}
              aria-controls="panel-filtros"
              onClick={() => setOpen(true)}
            >
              <Icon name="filter" size={16} />
              Filtrar{active > 0 && <span class="price">({active})</span>}
            </button>
          )}
          <label class="flex items-center gap-2">
            <span class="eyebrow hidden text-[10px] text-ink-soft sm:inline">Ordenar</span>
            <select
              class="h-9 w-36 rounded-[2px] border border-line bg-white px-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-crimson sm:w-auto sm:px-3"
              value={sort}
              onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)}
              aria-label="Ordenar perfumes"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div class={hasFilters ? 'lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12' : ''}>
        {hasFilters && (
          <div
            id="panel-filtros"
            class={
              open
                ? 'fixed inset-0 z-50 flex animate-fade-in items-end bg-ink/50 lg:static lg:z-auto lg:block lg:animate-none lg:bg-transparent'
                : 'hidden lg:block'
            }
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div
              ref={panelRef}
              role={open ? 'dialog' : undefined}
              aria-modal={open ? 'true' : undefined}
              aria-labelledby="filtros-titulo"
              class={`flex max-h-[85dvh] w-full flex-col bg-white lg:sticky lg:top-28 lg:max-h-none lg:animate-none lg:bg-transparent ${open ? 'animate-sheet-up' : ''}`}
            >
              <div class="flex items-center justify-between border-b border-line px-5 py-4 lg:border-0 lg:px-0 lg:pt-0 lg:pb-2">
                <h2 id="filtros-titulo" class="eyebrow font-sans! text-ink">
                  Filtrar
                </h2>
                {active > 0 && (
                  <button
                    type="button"
                    class="hidden text-xs text-ink-soft underline underline-offset-4 hover:text-ink lg:inline"
                    onClick={clear}
                  >
                    Limpiar ({active})
                  </button>
                )}
                <button
                  type="button"
                  class="-mr-2 grid size-10 place-items-center lg:hidden"
                  aria-label="Cerrar filtros"
                  onClick={() => setOpen(false)}
                >
                  <Icon name="close" />
                </button>
              </div>

              <div class="flex-1 overflow-y-auto px-5 lg:overflow-visible lg:px-0">
                {groups.map((group) => (
                  <fieldset key={group.key} class="border-b border-line py-5 last:border-0">
                    <legend class="eyebrow float-left mb-3 w-full text-[10px] text-ink-soft">
                      {group.title}
                    </legend>
                    <div class="clear-left flex flex-col">
                      {group.options.map((option) => {
                        const checked = filters[group.key].includes(option.value);
                        return (
                          <label
                            key={option.value}
                            class="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-ink"
                          >
                            <span class="relative grid size-4 shrink-0 place-items-center">
                              <input
                                type="checkbox"
                                class="peer size-4 appearance-none rounded-none border border-ink-soft bg-white transition-colors checked:border-ink checked:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
                                checked={checked}
                                onChange={() => toggle(group.key, option.value)}
                              />
                              <Icon
                                name="check"
                                size={12}
                                class="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100"
                              />
                            </span>
                            <span class="flex-1">{option.label}</span>
                            <span class="price text-xs text-ink-soft">{option.count}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>

              <div class="grid grid-cols-2 gap-3 border-t border-line px-5 py-4 lg:hidden">
                <button type="button" class={buttonClass('outline', 'md')} onClick={clear}>
                  Limpiar
                </button>
                <button
                  type="button"
                  class={buttonClass('primary', 'md')}
                  onClick={() => setOpen(false)}
                >
                  Ver {visible.length}
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <div hidden={visible.length === 0}>{children}</div>
          <div hidden={visible.length > 0}>{empty}</div>
        </div>
      </div>
    </div>
  );
}
