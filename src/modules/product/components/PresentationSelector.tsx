import { useState } from 'preact/hooks';
import { formatDiscount, formatPrice } from '@shared/lib/format';
import { badgeClass, buttonClass } from '@shared/ui/styles';
import Icon from '@shared/ui/Icon.tsx';

export interface PresentationOption {
  id: string;
  type: 'decant' | 'frasco';
  ml: number;
  tester: boolean;
  price: number;
  compareAtPrice: number | null;
  discount: number;
  available: boolean;
  /** Enlace wa.me ya armado en el servidor (módulo whatsapp). */
  whatsappUrl: string;
}

interface Props {
  options: PresentationOption[];
  defaultId: string | null;
  availabilityUrl: string;
  leadTime: string | null;
  leadTimeLabel: string | null;
  decantInfoHref: string;
}

const GROUPS = [
  { type: 'decant', title: 'Decant' },
  { type: 'frasco', title: 'Frasco completo' },
] as const;

export default function PresentationSelector({
  options,
  defaultId,
  availabilityUrl,
  leadTime,
  leadTimeLabel,
  decantInfoHref,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(defaultId);
  const selected = options.find((o) => o.id === selectedId && o.available) ?? null;
  const hasDecants = options.some((o) => o.type === 'decant');

  return (
    <div class="flex flex-col gap-8">
      <div class="flex min-h-10 flex-wrap items-baseline gap-x-3 gap-y-2" aria-live="polite">
        {selected ? (
          <>
            <span
              class={`price text-3xl font-medium ${selected.discount > 0 ? 'text-crimson' : 'text-ink'}`}
            >
              {formatPrice(selected.price)}
            </span>
            {selected.compareAtPrice !== null && selected.discount > 0 && (
              <>
                <s class="price text-base text-ink-soft">
                  <span class="sr-only">Antes </span>
                  {formatPrice(selected.compareAtPrice)}
                </s>
                <span class={badgeClass('accent')}>{formatDiscount(selected.discount)}</span>
              </>
            )}
          </>
        ) : (
          <span class="text-lg text-ink-soft">Agotado por ahora</span>
        )}
      </div>

      {GROUPS.map((group) => {
        const groupOptions = options.filter((o) => o.type === group.type);
        if (groupOptions.length === 0) return null;
        return (
          <fieldset key={group.type} class="flex flex-col gap-3">
            <legend class="eyebrow mb-3 flex items-center gap-2 text-ink">
              {group.title}
              <span class="text-ink-soft">· {groupOptions.map((o) => o.ml).join(' · ')} ml</span>
            </legend>
            <div class="flex flex-wrap gap-2">
              {groupOptions.map((o) => {
                const isSelected = o.id === selected?.id;
                return (
                  <label
                    key={o.id}
                    class={`relative flex min-h-[4.5rem] min-w-[6rem] flex-col items-start justify-center gap-1 border bg-white px-3.5 py-2.5 transition-colors duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-crimson ${
                      isSelected
                        ? 'border-ink ring-1 ring-ink ring-inset'
                        : o.available
                          ? 'cursor-pointer border-line hover:border-ink-soft'
                          : 'cursor-not-allowed border-line bg-paper text-ink-soft'
                    }`}
                  >
                    <input
                      type="radio"
                      name="presentacion"
                      value={o.id}
                      class="sr-only"
                      checked={isSelected}
                      disabled={!o.available}
                      onChange={() => setSelectedId(o.id)}
                    />
                    {isSelected && (
                      <span aria-hidden="true" class="absolute inset-x-0 top-0 h-0.5 bg-crimson" />
                    )}
                    <span
                      class={`text-sm font-medium ${o.available ? '' : 'line-through decoration-ink-soft/60'}`}
                    >
                      {o.ml} ml{o.tester && <span class="ml-1 text-xs font-normal">· Tester</span>}
                    </span>
                    <span class="price text-xs text-ink-soft">
                      {o.available ? formatPrice(o.price) : 'Agotado'}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div class="flex flex-col gap-4">
        <a
          href={selected ? selected.whatsappUrl : availabilityUrl}
          target="_blank"
          rel="noopener noreferrer"
          class={buttonClass(selected ? 'accent' : 'primary', 'lg', 'w-full')}
          data-whatsapp
        >
          <Icon name="whatsapp" size={18} />
          <span>{selected ? 'Comprar por WhatsApp' : 'Preguntar disponibilidad'}</span>
          <span class="sr-only">(se abre WhatsApp en una pestaña nueva)</span>
        </a>

        {leadTime && (
          <p class="flex items-start gap-3 text-sm text-ink-soft">
            <span aria-hidden="true" class="mt-2.5 h-px w-5 shrink-0 bg-crimson" />
            <span>
              {leadTimeLabel && <strong class="font-medium text-ink">{leadTimeLabel}. </strong>}
              Entrega estimada: {leadTime}.
            </span>
          </p>
        )}

        {hasDecants && (
          <a
            href={decantInfoHref}
            class="self-start text-sm text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-crimson"
          >
            ¿Qué es un decant?
          </a>
        )}
      </div>
    </div>
  );
}
