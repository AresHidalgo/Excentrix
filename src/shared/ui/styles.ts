/**
 * Clases de botón e insignia compartidas entre componentes Astro e islas Preact,
 * para que ambos se vean idénticos sin duplicar estilos.
 */
export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'outline-light' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2.5 rounded-[2px] font-sans text-xs font-medium tracking-[0.2em] uppercase transition-colors duration-300 ease-(--ease-luxe) disabled:pointer-events-none disabled:opacity-40';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/85',
  accent: 'bg-crimson text-white hover:bg-crimson-hover',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-white',
  'outline-light':
    'border border-white/60 text-white hover:border-white hover:bg-white hover:text-ink',
  link: 'px-0! py-0! h-auto! underline decoration-line underline-offset-8 hover:decoration-crimson',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4',
  md: 'h-12 px-6',
  lg: 'h-14 px-8',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra?: string,
): string {
  return [BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], extra]
    .filter(Boolean)
    .join(' ');
}

export type BadgeTone = 'ink' | 'accent' | 'outline' | 'paper' | 'muted';

const BADGE_TONES: Record<BadgeTone, string> = {
  ink: 'bg-ink text-white',
  accent: 'bg-crimson text-white',
  outline: 'border border-ink bg-white text-ink',
  paper: 'border border-crimson bg-white text-crimson',
  muted: 'bg-line text-ink-soft',
};

export function badgeClass(tone: BadgeTone = 'ink', extra?: string): string {
  return [
    'inline-flex h-6 items-center rounded-[1px] px-2 text-[10px] leading-none font-medium tracking-[0.18em] whitespace-nowrap uppercase',
    BADGE_TONES[tone],
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}
