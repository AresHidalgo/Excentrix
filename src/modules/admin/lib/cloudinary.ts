/**
 * Selector oficial de Cloudinary (Media Library Widget) para elegir o subir fotos de un
 * perfume. El administrador inicia sesión con su cuenta de Cloudinary dentro del widget, así
 * que no se necesita (ni se expone) el API Secret: solo el cloud name y la API Key públicos.
 * Las fotos se organizan en la carpeta excentrix/perfumes/{slug}/.
 */
import type { PerfumeImageDoc } from '@modules/product/documents';

const WIDGET_SRC = 'https://media-library.cloudinary.com/global/all.js';

export const perfumeFolder = (slug: string) => `excentrix/perfumes/${slug}`;

interface MediaAsset {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  resource_type?: string;
}

interface MediaLibrary {
  show: (options?: Record<string, unknown>) => void;
  hide: () => void;
}

declare global {
  interface Window {
    cloudinary?: {
      createMediaLibrary: (
        options: Record<string, unknown>,
        handlers: { insertHandler: (data: { assets: MediaAsset[] }) => void },
      ) => MediaLibrary;
    };
  }
}

let loading: Promise<void> | null = null;

function loadWidget(): Promise<void> {
  if (window.cloudinary) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('No se pudo cargar el selector de Cloudinary. Revisa tu conexión.'));
    };
    document.head.append(script);
  });
  return loading;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME && import.meta.env.PUBLIC_CLOUDINARY_API_KEY,
  );
}

/** Convierte lo que devuelve el widget en imágenes del perfume (solo imágenes, solo https). */
export function toPerfumeImages(assets: MediaAsset[], altBase: string): PerfumeImageDoc[] {
  return assets
    .filter(
      (a) =>
        (a.resource_type ?? 'image') === 'image' &&
        a.secure_url.startsWith('https://res.cloudinary.com/'),
    )
    .map((a) => ({
      url: a.secure_url,
      publicId: a.public_id,
      alt: altBase,
      kind: 'producto' as const,
      width: a.width ?? null,
      height: a.height ?? null,
    }));
}

/** Abre el selector en la carpeta del perfume y entrega las imágenes elegidas. */
export async function pickImages(slug: string, altBase: string): Promise<PerfumeImageDoc[]> {
  if (!isCloudinaryConfigured())
    throw new Error('Falta PUBLIC_CLOUDINARY_CLOUD_NAME o PUBLIC_CLOUDINARY_API_KEY.');
  await loadWidget();
  return new Promise((resolve) => {
    const library = window.cloudinary!.createMediaLibrary(
      {
        cloud_name: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: import.meta.env.PUBLIC_CLOUDINARY_API_KEY,
        multiple: true,
        max_files: 12,
        folder: { path: perfumeFolder(slug), resource_type: 'image' },
      },
      { insertHandler: (data) => resolve(toPerfumeImages(data.assets, altBase)) },
    );
    library.show();
  });
}

/* ───── Subida directa desde el admin ─────
 * Usa un "upload preset" sin firma de Cloudinary (PUBLIC_CLOUDINARY_UPLOAD_PRESET), configurado
 * en la consola de Cloudinary para aceptar solo imágenes en la carpeta excentrix/perfumes.
 * No requiere el API Secret.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export function isUploadConfigured(): boolean {
  return Boolean(
    import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME && import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  );
}

/** Revisa los archivos antes de subirlos. Devuelve un mensaje por archivo rechazado. */
export function checkFiles(files: File[]): { ok: File[]; rejected: string[] } {
  const ok: File[] = [];
  const rejected: string[] = [];
  for (const file of files) {
    if (!ACCEPTED_TYPES.includes(file.type))
      rejected.push(`${file.name}: usa JPG, PNG, WebP o AVIF.`);
    else if (file.size > MAX_UPLOAD_BYTES) rejected.push(`${file.name}: pesa más de 10 MB.`);
    else ok.push(file);
  }
  return { ok, rejected };
}

interface UploadResponse {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  error?: { message: string };
}

/** Sube una imagen a excentrix/perfumes/{slug}/ y devuelve la imagen lista para el perfume. */
export async function uploadImage(file: File, slug: string, alt: string): Promise<PerfumeImageDoc> {
  if (!isUploadConfigured()) {
    throw new Error('Falta PUBLIC_CLOUDINARY_UPLOAD_PRESET para subir fotos.');
  }
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  body.append('folder', perfumeFolder(slug));
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body },
  );
  const data = (await response.json()) as UploadResponse;
  if (!response.ok || data.error) {
    throw new Error(`No se pudo subir ${file.name}: ${data.error?.message ?? response.statusText}`);
  }
  const [image] = toPerfumeImages([{ ...data, resource_type: 'image' }], alt);
  if (!image) throw new Error(`Cloudinary devolvió una URL inesperada para ${file.name}.`);
  return image;
}
