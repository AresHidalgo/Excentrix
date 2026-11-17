/** @jsxImportSource react */
import { useState } from 'react';
import { signIn } from '../../lib/session';
import { Button, Field, inputClass, Notice } from './ui';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    setBusy(true);
    setError(await signIn(email, password));
    setBusy(false);
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-6 border border-line bg-white p-8"
      >
        <div className="flex flex-col items-center gap-3">
          <img
            src="/brand/logo-horizontal.svg"
            alt="Excentrix Perfumería"
            className="h-10 w-auto"
          />
          <p className="text-[11px] tracking-[0.28em] text-ink-soft uppercase">Administración</p>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Correo">
          <input
            type="email"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Contraseña">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Button type="submit" tone="primary" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}
