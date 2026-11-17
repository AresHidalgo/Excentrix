/** @jsxImportSource react */
import { useEffect, useState } from 'react';
import { SiteSettingsDocSchema, type SiteSettingsDoc } from '@modules/product/documents';
import { getSettings, saveSettings } from '../../lib/repository';
import { Button, Field, inputClass, Notice, Skeleton } from './ui';

export default function PricesEditor() {
  const [settings, setSettings] = useState<SiteSettingsDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => (s ? setSettings(s) : setLoadError('No hay ajustes guardados todavía.')))
      .catch(() => setLoadError('No pudimos cargar los ajustes. Revisa tu conexión.'));
  }, []);

  if (loadError) return <Notice tone="error">{loadError}</Notice>;
  if (!settings) return <Skeleton rows={5} />;

  const update = (patch: Partial<SiteSettingsDoc>) => {
    setState(null);
    setSettings({ ...settings, ...patch });
  };

  async function onSave() {
    const result = SiteSettingsDocSchema.safeParse(settings);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[issue.path.join('.')] ??= issue.message;
      setErrors(next);
      setState({ tone: 'error', text: 'Revisa los campos marcados.' });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await saveSettings(result.data);
      setState({
        tone: 'success',
        text: 'Ajustes guardados. Se verán en el sitio después de publicar.',
      });
    } catch {
      setState({ tone: 'error', text: 'No se pudo guardar. Intenta de nuevo.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl">Precios y ajustes</h1>
          <p className="text-sm text-ink-soft">Un precio por tamaño para todo el catálogo.</p>
        </div>
        <Button tone="accent" onClick={onSave} disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar'}
        </Button>
      </header>

      {state && <Notice tone={state.tone}>{state.text}</Notice>}

      <div className="flex flex-col gap-4 border border-line bg-white p-6">
        <h2 className="text-[11px] font-medium tracking-[0.12em] uppercase">
          Tamaños y precios (COP)
        </h2>
        {settings.sizes.map((size, i) => (
          <div
            key={size.ml}
            className="grid gap-4 border-b border-line pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[80px_minmax(0,1fr)_minmax(0,2fr)] sm:items-end"
          >
            <p className="font-display text-2xl">{size.ml} ml</p>
            <Field label="Precio" error={errors[`sizes.${i}.price`]}>
              <input
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                className={inputClass}
                value={size.price}
                onChange={(e) =>
                  update({
                    sizes: settings.sizes.map((s, j) =>
                      j === i ? { ...s, price: Number(e.target.value) } : s,
                    ),
                  })
                }
              />
            </Field>
            <Field label="Frase" error={errors[`sizes.${i}.note`]}>
              <input
                className={inputClass}
                value={size.note}
                onChange={(e) =>
                  update({
                    sizes: settings.sizes.map((s, j) =>
                      j === i ? { ...s, note: e.target.value } : s,
                    ),
                  })
                }
              />
            </Field>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5 border border-line bg-white p-6">
        <h2 className="text-[11px] font-medium tracking-[0.12em] uppercase">Contacto y anuncio</h2>
        <Field
          label="WhatsApp del vendedor"
          hint="Solo dígitos con indicativo, p. ej. 573001234567"
          error={errors.whatsappNumber}
        >
          <input
            inputMode="numeric"
            className={inputClass}
            value={settings.whatsappNumber ?? ''}
            onChange={(e) => update({ whatsappNumber: e.target.value.trim() || null })}
          />
        </Field>
        <Field label="Barra de anuncio" error={errors['announcementBar.text']}>
          <input
            className={inputClass}
            value={settings.announcementBar.text}
            onChange={(e) =>
              update({ announcementBar: { ...settings.announcementBar, text: e.target.value } })
            }
          />
        </Field>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={settings.announcementBar.active}
            onChange={(e) =>
              update({ announcementBar: { ...settings.announcementBar, active: e.target.checked } })
            }
          />
          Mostrar la barra de anuncio
        </label>
      </div>
    </section>
  );
}
