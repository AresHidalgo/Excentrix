/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  // Firebase (configuración web: pública por diseño; la seguridad la dan las reglas)
  readonly PUBLIC_FIREBASE_API_KEY?: string;
  readonly PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  readonly PUBLIC_FIREBASE_PROJECT_ID?: string;
  readonly PUBLIC_FIREBASE_APP_ID?: string;
  // Cloudinary (valores públicos)
  readonly PUBLIC_CLOUDINARY_CLOUD_NAME?: string;
  readonly PUBLIC_CLOUDINARY_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
