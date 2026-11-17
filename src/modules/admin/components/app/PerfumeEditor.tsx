/** @jsxImportSource react */
import { useEffect, useState } from 'react';
import {
  BADGES,
  CONCENTRATIONS,
  type BrandDoc,
  type CatalogSizeDoc,
  type PerfumeDoc,
  type PerfumeImageDoc,
} from '@modules/product/documents';
import {
  checkFiles,
  isCloudinaryConfigured,
  isUploadConfigured,
  pickImages,
  uploadImage,
} from '../../lib/cloudinary';
import {
  createPerfume,
  deletePerfume,
  getPerfume,
  getSettings,
  listBrands,
  savePerfume,
  slugFor,
  validatePerfume,
} from '../../lib/repository';
import LinesEditor from './LinesEditor';
import { Button, cloudinaryThumb, Field, inputClass, Notice, Skeleton } from './ui';

type Brand = BrandDoc & { id: string };

const BADGE_LABEL: Record<(typeof BADGES)[number], string> = {
  nuevo: 'Nuevo',
  'bajo-encargo': 'Bajo encargo',
  preventa: 'Preventa',
};

const list = (text: string) =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

function blankPerfume(sizes: CatalogSizeDoc[]): PerfumeDoc {
  const now = new Date().toISOString();
  return {
    slug: '',
    name: '',
    brandId: '',
    description: '',
    gender: 'unisex',
    house: 'disenador',
    concentration: null,
    olfactoryFamily: [],
    notes: { top: [], heart: [], base: [] },
    categoryIds: [],
    offers: {
      inspiracion: { active: true, sizes: sizes.map((s) => ({ ml: s.ml, available: true })) },
      replica: { active: false, sizes: [] },
      original: { active: false, sizes: [] },
    },
    badges: [],
    leadTime: null,
    images: [],
    featured: false,
    sortOrder: 9999,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

export default function PerfumeEditor({ slug }: { slug: string | null }) {
  const isNew = slug === null;
  const [perfume, setPerfume] = useState<PerfumeDoc | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sizes, setSizes] = useState<CatalogSizeDoc[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<{ tone: 'error' | 'success'; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState<{ done: number; total: number } | null>(null);
  // Textos libres separados por comas (se convierten en listas al guardar).
  const [texts, setTexts] = useState({ families: '', top: '', heart: '', base: '' });

  useEffect(() => {
    let alive = true;
    Promise.all([isNew ? Promise.resolve(null) : getPerfume(slug), listBrands(), getSettings()])
      .then(([p, b, settings]) => {
        if (!alive) return;
        const catalogSizes = settings?.sizes ?? [];
        if (!isNew && !p) return setLoadError('Este perfume no existe o no se pudo leer.');
        const data = p ?? blankPerfume(catalogSizes);
        setBrands(b);
        setSizes(catalogSizes);
        setPerfume(data);
        setTexts({
          families: data.olfactoryFamily.join(', '),
          top: data.notes.top.join(', '),
          heart: data.notes.heart.join(', '),
          base: data.notes.base.join(', '),
        });
      })
      .catch(() => alive && setLoadError('No pudimos cargar el perfume. Revisa tu conexión.'));
    return () => {
      alive = false;
    };
  }, [slug, isNew]);

  if (loadError) return <Notice tone="error">{loadError}</Notice>;
  if (!perfume) return <Skeleton rows={10} />;

  const brand = brands.find((b) => b.id === perfume.brandId);
  // Solo inspiración activa: el sitio lo muestra como "Inspirado en …".
  const onlyInspiration =
    perfume.offers.inspiracion.active &&
    !perfume.offers.replica.active &&
    !perfume.offers.original.active;
  const update = (patch: Partial<PerfumeDoc>) => {
    setSaveState(null);
    setPerfume((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      // En un perfume nuevo, la URL se arma sola con el nombre y la marca.
      if (isNew && ('name' in patch || 'brandId' in patch))
        next.slug = slugFor(next.name, next.brandId);
      return next;
    });
  };
  const setImages = (images: PerfumeImageDoc[]) => update({ images });

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || !perfume) return;
    const room = 12 - perfume.images.length;
    const { ok, rejected } = checkFiles(Array.from(fileList).slice(0, room));
    const problems = [...rejected];
    if (fileList.length > room) problems.push(`Solo caben ${room} foto(s) más (máximo 12).`);
    if (ok.length === 0) {
      if (problems.length) setSaveState({ tone: 'error', text: problems.join(' ') });
      return;
    }
    const alt =
      `Perfume ${onlyInspiration ? 'inspirado en ' : ''}${perfume.name} de ${brand?.name ?? ''}`.trim();
    const added: PerfumeImageDoc[] = [];
    setUpload({ done: 0, total: ok.length });
    for (const file of ok) {
      try {
        added.push(await uploadImage(file, perfume.slug, alt));
      } catch (error) {
        problems.push((error as Error).message);
      }
      setUpload((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUpload(null);
    if (added.length) setImages([...perfume.images, ...added].slice(0, 12));
    setSaveState(
      problems.length
        ? { tone: 'error', text: problems.join(' ') }
        : {
            tone: 'success',
            text: `${added.length} foto(s) subida(s) a Cloudinary. Pulsa “Guardar” para guardarlas en el perfume.`,
          },
    );
  }

  async function addImages() {
    try {
      const alt =
        `Perfume ${onlyInspiration ? 'inspirado en ' : ''}${perfume!.name} de ${brand?.name ?? ''}`.trim();
      const picked = await pickImages(perfume!.slug || 'sin-url', alt);
      const known = new Set(perfume!.images.map((i) => i.publicId));
      setImages([...perfume!.images, ...picked.filter((i) => !known.has(i.publicId))].slice(0, 12));
    } catch (error) {
      setSaveState({ tone: 'error', text: (error as Error).message });
    }
  }

  function moveImage(index: number, delta: number) {
    const images = [...perfume!.images];
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]];
    setImages(images);
  }

  async function onSave() {
    const candidate: PerfumeDoc = {
      ...perfume!,
      olfactoryFamily: list(texts.families),
      notes: { top: list(texts.top), heart: list(texts.heart), base: list(texts.base) },
      leadTime: perfume!.leadTime?.trim() ? perfume!.leadTime.trim() : null,
    };
    const result = validatePerfume(candidate);
    if (!result.ok) {
      setErrors(result.errors);
      setSaveState({ tone: 'error', text: 'Revisa los campos marcados.' });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (isNew) {
        await createPerfume(result.data);
        window.location.hash = `#/perfume/${encodeURIComponent(result.data.slug)}`;
      } else {
        await savePerfume(result.data);
        setPerfume(result.data);
        setSaveState({
          tone: 'success',
          text: `Guardado a las ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}. Se verá en el sitio después de publicar.`,
        });
      }
    } catch (error) {
      setSaveState({
        tone: 'error',
        text: (error as Error).message || 'No se pudo guardar. Intenta de nuevo.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!window.confirm(`¿Eliminar "${perfume!.name}"? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    try {
      await deletePerfume(perfume!.slug);
      window.location.hash = '#/perfumes';
    } catch {
      setSaveState({ tone: 'error', text: 'No se pudo eliminar. Intenta de nuevo.' });
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <a href="#/perfumes" className="text-xs text-ink-soft hover:text-ink">
            ← Perfumes
          </a>
          <h1 className="font-display text-3xl">
            {isNew ? 'Nuevo perfume' : `${onlyInspiration ? 'Inspirado en ' : ''}${perfume.name}`}
          </h1>
          <p className="text-xs text-ink-soft">URL: /perfume/{perfume.slug || '…'}</p>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button tone="danger" onClick={onDelete} disabled={busy}>
              Eliminar
            </Button>
          )}
          <Button tone="accent" onClick={onSave} disabled={busy}>
            {busy ? 'Guardando…' : isNew ? 'Crear perfume' : 'Guardar'}
          </Button>
        </div>
      </header>

      {saveState && <Notice tone={saveState.tone}>{saveState.text}</Notice>}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6 border border-line bg-white p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Fragancia" error={errors.name}>
              <input
                className={inputClass}
                value={perfume.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </Field>
            <Field label="Marca" error={errors.brandId}>
              <select
                className={inputClass}
                value={perfume.brandId}
                onChange={(e) => {
                  const b = brands.find((x) => x.id === e.target.value);
                  update({ brandId: e.target.value, ...(b ? { house: b.house } : {}) });
                }}
              >
                <option value="">Elige una marca</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Género" error={errors.gender}>
              <select
                className={inputClass}
                value={perfume.gender}
                onChange={(e) => update({ gender: e.target.value as PerfumeDoc['gender'] })}
              >
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
                <option value="unisex">Unisex</option>
              </select>
            </Field>
            <Field label="Casa" error={errors.house}>
              <select
                className={inputClass}
                value={perfume.house}
                onChange={(e) => update({ house: e.target.value as PerfumeDoc['house'] })}
              >
                <option value="disenador">Diseñador</option>
                <option value="nicho">Nicho</option>
                <option value="arabe">Árabe</option>
              </select>
            </Field>
            <Field label="Concentración" error={errors.concentration}>
              <select
                className={inputClass}
                value={perfume.concentration ?? ''}
                onChange={(e) =>
                  update({ concentration: (e.target.value || null) as PerfumeDoc['concentration'] })
                }
              >
                <option value="">Sin especificar</option>
                {CONCENTRATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado" error={errors.status}>
              <select
                className={inputClass}
                value={perfume.status}
                onChange={(e) => update({ status: e.target.value as PerfumeDoc['status'] })}
              >
                <option value="published">Publicado</option>
                <option value="draft">Borrador (no se muestra)</option>
              </select>
            </Field>
          </div>

          <Field label="Descripción" error={errors.description}>
            <textarea
              rows={4}
              className={inputClass}
              value={perfume.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Familia olfativa"
              hint="Separadas por comas: ámbar, amaderado"
              error={errors.olfactoryFamily}
            >
              <input
                className={inputClass}
                value={texts.families}
                onChange={(e) => setTexts({ ...texts, families: e.target.value })}
              />
            </Field>
            <Field label="Notas de salida" hint="Separadas por comas" error={errors['notes.top']}>
              <input
                className={inputClass}
                value={texts.top}
                onChange={(e) => setTexts({ ...texts, top: e.target.value })}
              />
            </Field>
            <Field
              label="Notas de corazón"
              hint="Separadas por comas"
              error={errors['notes.heart']}
            >
              <input
                className={inputClass}
                value={texts.heart}
                onChange={(e) => setTexts({ ...texts, heart: e.target.value })}
              />
            </Field>
            <Field label="Notas de fondo" hint="Separadas por comas" error={errors['notes.base']}>
              <input
                className={inputClass}
                value={texts.base}
                onChange={(e) => setTexts({ ...texts, base: e.target.value })}
              />
            </Field>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <LinesEditor
            offers={perfume.offers}
            catalogSizes={sizes}
            errors={errors}
            onChange={(offers) => update({ offers })}
          />

          <div className="flex flex-col gap-4 border border-line bg-white p-6">
            <h2 className="text-[11px] font-medium tracking-[0.12em] uppercase">Etiquetas</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              {BADGES.map((b) => (
                <label key={b} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={perfume.badges.includes(b)}
                    onChange={(e) =>
                      update({
                        badges: e.target.checked
                          ? [...perfume.badges, b]
                          : perfume.badges.filter((x) => x !== b),
                      })
                    }
                  />
                  {BADGE_LABEL[b]}
                </label>
              ))}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={perfume.featured}
                  onChange={(e) => update({ featured: e.target.checked })}
                />
                Destacado
              </label>
            </div>
            <Field
              label="Tiempo de entrega"
              hint="Solo para bajo encargo o preventa"
              error={errors.leadTime}
            >
              <input
                className={inputClass}
                value={perfume.leadTime ?? ''}
                onChange={(e) => update({ leadTime: e.target.value })}
                placeholder="8 a 15 días hábiles"
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 border border-line bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-[11px] font-medium tracking-[0.12em] uppercase">
              Fotos (Cloudinary)
            </h2>
            <p className="text-xs text-ink-soft">
              Carpeta: excentrix/perfumes/{perfume.slug || '…'} · la primera es la principal ·
              máximo 12
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label
              className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 bg-ink px-4 text-xs font-medium tracking-[0.12em] text-white uppercase transition-colors hover:bg-ink/85 ${!isUploadConfigured() || !perfume.slug || perfume.images.length >= 12 || upload ? 'pointer-events-none opacity-50' : ''}`}
            >
              {upload ? `Subiendo ${upload.done}/${upload.total}…` : 'Subir fotos'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="sr-only"
                disabled={
                  !isUploadConfigured() ||
                  !perfume.slug ||
                  perfume.images.length >= 12 ||
                  Boolean(upload)
                }
                onChange={(e) => {
                  void uploadFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
            <Button
              tone="outline"
              onClick={addImages}
              disabled={!isCloudinaryConfigured() || !perfume.slug || perfume.images.length >= 12}
            >
              Elegir de la biblioteca
            </Button>
          </div>
        </div>
        {!isUploadConfigured() && (
          <Notice tone="error">
            Para subir fotos falta el upload preset de Cloudinary (PUBLIC_CLOUDINARY_UPLOAD_PRESET).
          </Notice>
        )}
        {!isCloudinaryConfigured() && (
          <Notice tone="error">Falta configurar Cloudinary (PUBLIC_CLOUDINARY_*).</Notice>
        )}
        {isNew && !perfume.slug && (
          <Notice>Escribe el nombre y elige la marca para poder agregar fotos.</Notice>
        )}
        {perfume.images.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Sin fotos: el sitio muestra la silueta del frasco.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {perfume.images.map((img, i) => (
              <li key={img.publicId} className="flex flex-col gap-2 border border-line p-2">
                <img
                  src={cloudinaryThumb(img.url)}
                  alt={img.alt}
                  className="aspect-[4/5] w-full bg-white object-contain"
                  loading="lazy"
                />
                {i === 0 && (
                  <span className="text-[10px] tracking-[0.12em] text-crimson uppercase">
                    Principal
                  </span>
                )}
                <select
                  aria-label="Tipo de foto"
                  className={inputClass}
                  value={img.kind}
                  onChange={(e) =>
                    setImages(
                      perfume.images.map((x, j) =>
                        j === i ? { ...x, kind: e.target.value as PerfumeImageDoc['kind'] } : x,
                      ),
                    )
                  }
                >
                  <option value="producto">Producto</option>
                  <option value="ambiente">Ambiente</option>
                </select>
                <input
                  aria-label="Texto alternativo"
                  className={inputClass}
                  value={img.alt}
                  onChange={(e) =>
                    setImages(
                      perfume.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)),
                    )
                  }
                />
                <div className="flex justify-between gap-1">
                  <Button
                    tone="ghost"
                    className="px-2"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    aria-label="Mover antes"
                  >
                    ←
                  </Button>
                  <Button
                    tone="ghost"
                    className="px-2"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === perfume.images.length - 1}
                    aria-label="Mover después"
                  >
                    →
                  </Button>
                  <Button
                    tone="ghost"
                    className="px-2 text-crimson"
                    onClick={() => setImages(perfume.images.filter((_, j) => j !== i))}
                  >
                    Quitar
                  </Button>
                </div>
                {errors[`images.${i}.url`] && (
                  <span className="text-xs text-crimson">{errors[`images.${i}.url`]}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
