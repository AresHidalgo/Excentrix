import { useEffect, useRef, useState } from 'preact/hooks';
import Icon from '@shared/ui/Icon.tsx';
import type { MenuItem } from '@modules/catalog';

interface Props {
  menu: MenuItem[];
  currentPath: string;
  homeHref: string;
  whatsappHref: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Botón hamburguesa + panel lateral izquierdo (solo < xl). */
export default function MobileNav({ menu, currentPath, homeHref, whatsappHref }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  const linkClass = (href?: string) =>
    `flex items-center justify-between py-4 font-display text-2xl ${
      href === currentPath ? 'text-crimson' : 'text-ink'
    }`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        class="-ml-2 grid size-11 place-items-center text-ink"
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="menu-movil"
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" size={24} />
      </button>

      {open && (
        <div
          class="fixed inset-0 z-50 animate-fade-in bg-ink/50"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            ref={panelRef}
            id="menu-movil"
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            class="flex h-full w-[86%] max-w-sm animate-drawer-in flex-col bg-paper"
          >
            <div class="flex items-center justify-between border-b border-line px-5 py-3">
              <a href={homeHref} class="block">
                <img
                  src="/brand/logo-horizontal.svg"
                  alt="Excentrix Perfumería"
                  width="1462"
                  height="425"
                  class="h-9 w-auto"
                />
              </a>
              <button
                type="button"
                class="-mr-2 grid size-11 place-items-center"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
              >
                <Icon name="close" size={24} />
              </button>
            </div>

            <nav aria-label="Principal" class="flex-1 overflow-y-auto px-5">
              <ul class="divide-y divide-line">
                {menu.map((item, index) =>
                  item.children ? (
                    <li key={item.label}>
                      <button
                        type="button"
                        class={`${linkClass()} w-full text-left`}
                        aria-expanded={expanded === item.label}
                        aria-controls={`submenu-${index}`}
                        onClick={() =>
                          setExpanded((prev) => (prev === item.label ? null : item.label))
                        }
                      >
                        {item.label}
                        <Icon
                          name="chevron-down"
                          class={`transition-transform duration-300 ${expanded === item.label ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <ul
                        id={`submenu-${index}`}
                        hidden={expanded !== item.label}
                        class="flex flex-col gap-1 pb-4 pl-4"
                      >
                        {item.children.map((child) => (
                          <li key={child.label}>
                            <a
                              href={child.href}
                              class={`eyebrow block py-2.5 ${child.href === currentPath ? 'text-crimson' : 'text-ink-soft'}`}
                              aria-current={child.href === currentPath ? 'page' : undefined}
                            >
                              {child.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        class={linkClass(item.href)}
                        aria-current={item.href === currentPath ? 'page' : undefined}
                      >
                        {item.label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </nav>

            <div class="border-t border-line px-5 py-5">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                class="eyebrow flex items-center gap-3 text-ink"
              >
                <Icon name="whatsapp" size={18} />
                Escríbenos por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
