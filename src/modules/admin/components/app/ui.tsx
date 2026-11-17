/** @jsxImportSource react */
import type { ReactNode } from 'react';

/** Piezas visuales pequeñas del admin (mismos tokens del sitio, versión utilitaria). */

export const inputClass =
  'w-full border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-ink disabled:bg-paper disabled:text-ink-soft';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-[0.12em] text-ink uppercase">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-crimson">{error}</span>
      ) : (
        hint && <span className="text-xs text-ink-soft">{hint}</span>
      )}
    </label>
  );
}

type ButtonTone = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';

const TONES: Record<ButtonTone, string> = {
  primary: 'bg-ink text-white hover:bg-ink/85',
  accent: 'bg-crimson text-white hover:bg-crimson-hover',
  outline: 'border border-line bg-white text-ink hover:border-ink',
  ghost: 'text-ink hover:bg-paper',
  danger: 'border border-crimson/40 text-crimson hover:bg-crimson hover:text-white',
};

export function Button({
  tone = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 px-4 text-xs font-medium tracking-[0.12em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${TONES[tone]} ${className}`}
    />
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error' | 'success';
  children: ReactNode;
}) {
  const styles = {
    info: 'border-line bg-white text-ink-soft',
    error: 'border-crimson/40 bg-crimson/5 text-crimson',
    success: 'border-ink/20 bg-white text-ink',
  }[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`border px-4 py-3 text-sm ${styles}`}
    >
      {children}
    </div>
  );
}

export function Skeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 animate-pulse bg-line/60" />
      ))}
    </div>
  );
}

/** Miniatura de Cloudinary: inserta una transformación 4:5 con fondo blanco en la URL. */
export function cloudinaryThumb(url: string, width = 160): string {
  return url.replace('/upload/', `/upload/c_pad,ar_4:5,b_white,f_auto,q_auto,w_${width}/`);
}
