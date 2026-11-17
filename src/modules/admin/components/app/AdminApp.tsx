/** @jsxImportSource react */
import { useEffect, useState } from 'react';
import { isFirebaseConfigured } from '../../lib/firebase';
import { signOut, watchSession, type SessionState } from '../../lib/session';
import LoginForm from './LoginForm';
import PerfumeEditor from './PerfumeEditor';
import PerfumeList from './PerfumeList';
import PricesEditor from './PricesEditor';
import { Button, Notice } from './ui';

/** Rutas internas por hash: #/perfumes · #/perfume/{slug} · #/nuevo · #/precios */
type Route =
  { view: 'list' } | { view: 'edit'; slug: string } | { view: 'new' } | { view: 'prices' };

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  if (path.startsWith('perfume/')) return { view: 'edit', slug: decodeURIComponent(path.slice(8)) };
  if (path === 'nuevo') return { view: 'new' };
  if (path === 'precios') return { view: 'prices' };
  return { view: 'list' };
}

function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export default function AdminApp() {
  const [session, setSession] = useState<SessionState>({ status: 'loading' });
  const route = useRoute();

  useEffect(() => (isFirebaseConfigured() ? watchSession(setSession) : undefined), []);

  if (!isFirebaseConfigured()) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <Notice tone="error">
          Falta la configuración de Firebase (variables PUBLIC_FIREBASE_*). El admin no puede
          iniciar.
        </Notice>
      </main>
    );
  }
  if (session.status === 'loading') {
    return (
      <main className="grid min-h-dvh place-items-center text-sm text-ink-soft">Cargando…</main>
    );
  }
  if (session.status === 'signed-out') return <LoginForm />;
  if (session.status === 'not-admin') {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <div className="flex max-w-sm flex-col gap-4">
          <Notice tone="error">La cuenta {session.email} no tiene permiso de administrador.</Notice>
          <Button tone="outline" onClick={() => signOut()}>
            Cerrar sesión
          </Button>
        </div>
      </main>
    );
  }

  const nav = [
    {
      label: 'Perfumes',
      href: '#/perfumes',
      active: route.view === 'list' || route.view === 'edit' || route.view === 'new',
    },
    { label: 'Precios y ajustes', href: '#/precios', active: route.view === 'prices' },
  ];

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 bg-ink p-5 text-white lg:sticky lg:top-0 lg:h-dvh">
        <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-start">
          <img src="/brand/logo-horizontal-negativo.svg" alt="Excentrix" className="h-8 w-auto" />
          <span className="text-[10px] tracking-[0.28em] text-white/50 uppercase">Admin</span>
        </div>
        <nav aria-label="Admin" className="flex gap-1 lg:flex-col">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={`px-3 py-2 text-sm transition-colors ${item.active ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto hidden flex-col gap-2 text-xs text-white/50 lg:flex">
          <span className="truncate">{session.user.email}</span>
          <button
            type="button"
            onClick={() => signOut()}
            className="self-start underline hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">
        {route.view === 'list' && <PerfumeList />}
        {route.view === 'edit' && <PerfumeEditor key={route.slug} slug={route.slug} />}
        {route.view === 'new' && <PerfumeEditor key="nuevo" slug={null} />}
        {route.view === 'prices' && <PricesEditor />}
      </main>
    </div>
  );
}
