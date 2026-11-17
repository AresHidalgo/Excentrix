/** @jsxImportSource react */
import type { CatalogSizeDoc, OffersDoc, PricedSizeDoc } from '@modules/product/documents';
import { Button, inputClass } from './ui';

/**
 * Líneas en las que se ofrece el perfume:
 *   Inspiración  tamaños de la tabla única (precio en "Precios y ajustes")
 *   Réplica 1.1  tamaños y precio por perfume (imitación del perfume y del frasco)
 *   Original     tamaños y precio por perfume (producto de la marca)
 */
interface Props {
  offers: OffersDoc;
  catalogSizes: CatalogSizeDoc[];
  errors: Record<string, string>;
  onChange: (offers: OffersDoc) => void;
}

const formatCop = (n: number) =>
  `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n).replace(/,/g, '.')}`;

function Toggle({
  label,
  description,
  active,
  onChange,
}: {
  label: string;
  description: string;
  active: boolean;
  onChange: (active: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        className="mt-1"
        checked={active}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-ink-soft">{description}</span>
      </span>
    </label>
  );
}

function PricedSizes({
  line,
  sizes,
  error,
  onChange,
}: {
  line: 'replica' | 'original';
  sizes: PricedSizeDoc[];
  error?: string;
  onChange: (sizes: PricedSizeDoc[]) => void;
}) {
  const set = (i: number, patch: Partial<PricedSizeDoc>) =>
    onChange(sizes.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const nextMl = () => {
    const used = new Set(sizes.map((s) => s.ml));
    return [100, 50, 30, 60, 75, 80, 90, 125, 150, 200].find((ml) => !used.has(ml)) ?? 100;
  };
  return (
    <div className="flex flex-col gap-3 pl-7">
      {sizes.length === 0 && (
        <p className="text-xs text-ink-soft">Agrega al menos un tamaño con su precio.</p>
      )}
      {sizes.map((s, i) => (
        <div
          key={`${line}-${i}`}
          className="grid grid-cols-[90px_minmax(0,1fr)_auto_auto] items-center gap-2"
        >
          <label className="flex items-center gap-1 text-sm">
            <input
              type="number"
              min={1}
              aria-label="Mililitros"
              className={inputClass}
              value={s.ml}
              onChange={(e) => set(i, { ml: Number(e.target.value) })}
            />
            <span className="text-xs text-ink-soft">ml</span>
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            aria-label="Precio en pesos"
            placeholder="Precio COP"
            className={inputClass}
            value={s.price || ''}
            onChange={(e) => set(i, { price: Number(e.target.value) })}
          />
          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={s.available}
              onChange={(e) => set(i, { available: e.target.checked })}
            />
            Disponible
          </label>
          <Button
            tone="ghost"
            className="px-2 text-crimson"
            onClick={() => onChange(sizes.filter((_, j) => j !== i))}
          >
            Quitar
          </Button>
        </div>
      ))}
      {error && <p className="text-xs text-crimson">{error}</p>}
      <Button
        tone="outline"
        className="self-start"
        onClick={() => onChange([...sizes, { ml: nextMl(), price: 0, available: true }])}
        disabled={sizes.length >= 10}
      >
        Agregar tamaño
      </Button>
    </div>
  );
}

export default function LinesEditor({ offers, catalogSizes, errors, onChange }: Props) {
  const { inspiracion, replica, original } = offers;
  const set = <K extends keyof OffersDoc>(line: K, value: OffersDoc[K]) =>
    onChange({ ...offers, [line]: value });
  const inspirationSize = (ml: number) => inspiracion.sizes.find((s) => s.ml === ml);

  return (
    <div className="flex flex-col gap-5 border border-line bg-white p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[11px] font-medium tracking-[0.12em] uppercase">Líneas y precios</h2>
        <p className="text-xs text-ink-soft">
          El comprador elige entre las líneas activas de este perfume.
        </p>
      </div>
      {errors['offers._'] && <p className="text-xs text-crimson">{errors['offers._']}</p>}

      <section className="flex flex-col gap-3 border-t border-line pt-4">
        <Toggle
          label="Inspiración"
          description="Fragancia inspirada. Precio de la tabla única (Precios y ajustes)."
          active={inspiracion.active}
          onChange={(active) =>
            set('inspiracion', {
              active,
              sizes:
                active && inspiracion.sizes.length === 0
                  ? catalogSizes.map((s) => ({ ml: s.ml, available: true }))
                  : inspiracion.sizes,
            })
          }
        />
        {inspiracion.active && (
          <ul className="flex flex-col gap-2 pl-7">
            {catalogSizes.map((cs) => {
              const offered = inspirationSize(cs.ml);
              return (
                <li
                  key={cs.ml}
                  className="flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(offered)}
                      onChange={(e) => {
                        const others = inspiracion.sizes.filter((s) => s.ml !== cs.ml);
                        set('inspiracion', {
                          ...inspiracion,
                          sizes: e.target.checked
                            ? [...others, { ml: cs.ml, available: true }].sort(
                                (a, b) => a.ml - b.ml,
                              )
                            : others,
                        });
                      }}
                    />
                    {cs.ml} ml{' '}
                    <span className="text-xs text-ink-soft">· {formatCop(cs.price)}</span>
                  </label>
                  {offered && (
                    <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                      <input
                        type="checkbox"
                        checked={offered.available}
                        onChange={(e) =>
                          set('inspiracion', {
                            ...inspiracion,
                            sizes: inspiracion.sizes.map((s) =>
                              s.ml === cs.ml ? { ...s, available: e.target.checked } : s,
                            ),
                          })
                        }
                      />
                      Disponible
                    </label>
                  )}
                </li>
              );
            })}
            {errors['offers.inspiracion.sizes'] && (
              <p className="text-xs text-crimson">{errors['offers.inspiracion.sizes']}</p>
            )}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-4">
        <Toggle
          label="Réplica 1.1"
          description="Imitación del perfume y de su frasco. Se mostrará siempre como imitación, nunca como original."
          active={replica.active}
          onChange={(active) => set('replica', { ...replica, active })}
        />
        {replica.active && (
          <PricedSizes
            line="replica"
            sizes={replica.sizes}
            error={firstError(errors, 'offers.replica')}
            onChange={(sizes) => set('replica', { ...replica, sizes })}
          />
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-4">
        <Toggle
          label="Original"
          description="El perfume original de la marca, con precio propio."
          active={original.active}
          onChange={(active) => set('original', { ...original, active })}
        />
        {original.active && (
          <PricedSizes
            line="original"
            sizes={original.sizes}
            error={firstError(errors, 'offers.original')}
            onChange={(sizes) => set('original', { ...original, sizes })}
          />
        )}
      </section>
    </div>
  );
}

/** Primer error de validación bajo una ruta (p. ej. "offers.replica.sizes.0.price"). */
function firstError(errors: Record<string, string>, prefix: string): string | undefined {
  const key = Object.keys(errors).find((k) => k.startsWith(prefix));
  return key ? errors[key] : undefined;
}
