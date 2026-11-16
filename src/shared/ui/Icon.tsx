import { ICONS, type IconDef, type IconName } from './icons';

interface Props {
  name: IconName;
  size?: number;
  class?: string;
}

/** Versión Preact de Icon.astro para usar dentro de islas. Siempre decorativo. */
export default function Icon({ name, size = 20, class: className }: Props) {
  const icon: IconDef = ICONS[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={icon.fill ? 'currentColor' : 'none'}
      stroke={icon.fill ? 'none' : 'currentColor'}
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={['shrink-0', className].filter(Boolean).join(' ')}
      aria-hidden="true"
      focusable="false"
    >
      {icon.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
