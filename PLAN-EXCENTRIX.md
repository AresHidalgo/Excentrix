# Excentrix Perfumería — Plan del proyecto

Catálogo-tienda de perfumes con cierre de venta por WhatsApp Business.
Stack: **Astro + Firebase plan Spark gratuito (Hosting, Firestore, Auth) + Cloudinary (imágenes) +
Cloudflare Worker (mini backend gratuito)**. Costo mensual esperado: $0.
Fecha del plan: 2026-11-14.

---

## 1. Objetivo y alcance

**Qué es:** un catálogo de perfumes navegable por secciones (Nicho, Diseñador, Árabe, Decants, etc.)
donde el cliente elige perfume y tamaño y, al pulsar "Comprar", se abre WhatsApp Business del
vendedor con un mensaje ya escrito (perfume, tamaño, precio y enlace).

**Qué NO es (en la v1):** no hay pasarela de pago, no hay cuentas de cliente, no hay cálculo de envíos.
El pago y el envío se cierran en WhatsApp. Esto mantiene la v1 simple y rápida de lanzar.

**Referencia funcional (jordania.com.co), lo que tomamos:**

| Jordania | Excentrix |
|---|---|
| Barra superior de anuncio ("Envío gratis + $179.999") | Igual, editable desde el admin |
| Menú: Ofertas, Bajo encargo, Género, Sets, Nicho, Diseñador, Árabe, Decants | Mismo esquema, pero las secciones las creas tú en el admin |
| Buscador visible en el header | Igual (búsqueda instantánea) |
| Carrusel de banners en el inicio | Igual, banners gestionados en el admin |
| Producto con selector de tamaño (3/5/10/30/100 ml), precio por tamaño | Igual, separando "Decant" y "Frasco completo" en el selector |
| Carrito + checkout Shopify | Botón "Comprar por WhatsApp" en cada perfume (sin carrito) |
| Botón flotante de WhatsApp | Igual |
| Página educativa "¿Qué es un decant?" | Igual |
| Lo que NO copiamos | Tema genérico de Shopify, banners saturados. Excentrix va más editorial y de lujo |

---

## 2. Arquitectura

```
                    ┌──────────────────────────────┐
  Admin (tú)  ───▶  │  /admin  (Astro + React)     │
                    │  Firebase Auth (solo admin)  │
                    └───────┬──────────────┬───────┘
          escribe datos     │              │ pide firma / "Publicar"
                    ┌───────▼───────┐  ┌───▼──────────────────────┐
                    │  Firestore    │  │ Cloudflare Worker        │
                    │  (perfumes,   │  │ (verifica token admin)   │
                    │  categorías,  │  │ · firma subidas          │
                    │  marcas,      │  │ · dispara el build       │
                    │  banners,     │  └───┬──────────────┬───────┘
                    │  ajustes)     │      │ firma        │ repository_dispatch
                    └───────┬───────┘  ┌───▼────────┐  ┌──▼──────────────────────────┐
                            │          │ Cloudinary │  │ GitHub Actions: astro build │
                            │          │ (imágenes) │  │ + deploy a Firebase Hosting │
                            │          └───┬────────┘  └──┬──────────────────────────┘
                            └── lee en el build ──────────┤
                                       │ CDN imágenes     │
                    ┌──────────────────▼──────────────────▼┐
  Cliente  ───────▶ │ Sitio estático (Firebase Hosting CDN) │──▶ wa.me/57XXXXXXXXXX?text=...
                    │ HTML pre-renderizado, SEO             │
                    └───────────────────────────────────────┘
```

### Decisión clave: sitio estático + "Publicar"

- **Catálogo pre-renderizado (SSG):** cada perfume y colección se genera como HTML estático en el build.
  Resultado: carga casi instantánea, excelente SEO (Google indexa cada perfume), costo de hosting ~0.
- **Cuando editas en el admin:** guardas cambios (quedan en Firestore) y pulsas **"Publicar cambios"**.
  Eso dispara un rebuild que tarda ~1–3 minutos y actualiza el sitio.
- **Alternativa descartada:** cargar el catálogo desde Firestore en el navegador del cliente. Es
  inmediato, pero peor SEO, más lento en móvil y más lecturas de Firestore (costo). Para un catálogo
  que cambia unas veces al día, SSG es lo profesional.
- **Alternativa descartada:** SSR (servidor). Firebase App Hosting no soporta Astro oficialmente; añade
  complejidad y costo sin beneficio real para este caso.

### Servicios y costos (decisión: sin plan Blaze)

| Servicio | Plan | Para qué | Límite gratuito relevante |
|---|---|---|---|
| Firebase Hosting | Spark (gratis) | Servir el sitio | 10 GB almacenamiento, 360 MB/día de transferencia |
| Firestore | Spark | Datos del catálogo | 50.000 lecturas/día (el sitio público no lee Firestore: solo el build y el admin) |
| Firebase Auth | Spark | Login del admin | De sobra para 1–3 administradores |
| **Cloudinary** | Free | Guardar y optimizar imágenes | 25 créditos/mes (~25 GB de almacenamiento o transferencia) |
| **Cloudflare Worker** | Free | Mini backend: firmar subidas y disparar el build | 100.000 peticiones/día |
| GitHub Actions | Free | Build y deploy | Ilimitado en repo público; 2.000 min/mes en privado (cada build ~2 min) |

**Por qué Cloudinary:** sirve cada imagen desde su CDN ya convertida a WebP/AVIF y al tamaño exacto
según la pantalla (`f_auto,q_auto,w_…`), así que las fotos quedan livianas sin trabajo extra.

**Por qué un Cloudflare Worker:** sin Cloud Functions no hay un lugar seguro donde guardar las claves
de Cloudinary y de GitHub. El Worker (unas 80 líneas) recibe la petición del admin, **verifica que el
token de Firebase Auth sea del administrador** y solo entonces:
1. firma la subida de imágenes a Cloudinary (subidas firmadas: nadie más puede subir a tu cuenta);
2. llama a GitHub para lanzar el rebuild cuando pulsas "Publicar".

Las claves secretas viven solo en el Worker y en GitHub Secrets, nunca en el navegador.

**Alternativa más simple, menos segura (descartada):** subidas "unsigned" a Cloudinary y rebuild por
horario cada 30 min. Evita el Worker, pero cualquiera que inspeccione el admin podría subir imágenes a
tu cuenta, y los cambios tardarían hasta media hora en salir.

**Si más adelante pasas a Blaze**, el Worker se reemplaza por una Cloud Function sin tocar el resto.

### Dominio

**Decidido: lanzar con `excentrix.web.app`** (gratis, incluido con Firebase Hosting, SSL automático).

- El subdominio sale del **ID del proyecto Firebase**. Si `excentrix` ya está tomado, alternativas:
  `excentrix-perfumeria`, `excentrixperfumes` o `excentrix-co`. Se confirma al crear el proyecto.
- El ID del proyecto **no se puede cambiar después**, así que se elige con cuidado en la fase 0.
- El dominio base vive en **una sola variable** (`PUBLIC_SITE_URL`), que usan las URL canónicas, el
  sitemap, Open Graph, los enlaces de WhatsApp y el CORS del Worker. Migrar luego a un dominio propio
  (`excentrix.co` / `.com.co`, ~$15–30 USD/año) es cambiar esa variable, conectar el dominio en
  Firebase Hosting y dejar `web.app` redirigiendo con 301 para no perder posicionamiento en Google.

---

## 3. Stack técnico

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | **Astro 7** (requiere Node ≥ 22.23.4; se usa Node 24 LTS) + TypeScript estricto | HTML estático, islas de JS solo donde se necesita |
| Estilos | **Tailwind CSS v4** con tokens de marca | Consistencia y velocidad |
| Interactividad pública | Islas **Preact** (selector de tamaño + botón WhatsApp, filtros) | Ligero (~4 KB) |
| Búsqueda | **Pagefind** | Búsqueda instantánea sin servidor, indexa en el build |
| Admin | **React** + componentes **shadcn/ui** dentro de `/admin` | UI de dashboard sólida |
| Validación | **Zod** (esquemas compartidos admin ↔ build) | Un solo contrato de datos |
| Datos | Firestore · Auth (Firebase SDK v11 modular) | Plan Spark gratuito |
| Build-time | `firebase-admin` con cuenta de servicio en secretos de GitHub | Lee datos de forma segura |
| Imágenes | **Cloudinary**: subida firmada desde el admin, entrega con `f_auto,q_auto` y `srcset` responsive | Imágenes livianas sin procesarlas en el build |
| Mini backend | **Cloudflare Worker** (TypeScript, `jose` para verificar el token de Firebase) | Firma subidas y dispara builds sin plan Blaze |
| CI/CD | GitHub Actions | Preview por PR, deploy a producción en `main` |
| Analítica | GA4 / Firebase Analytics | Medir qué perfumes generan clics a WhatsApp |

---

## 4. Modelo de datos (Firestore)

### `perfumes/{id}`
```ts
{
  name: "Dynasty",
  slug: "dynasty-lattafa",
  brandId: "lattafa",
  description: "…",
  gender: "hombre" | "mujer" | "unisex",
  concentration: "EDT" | "EDP" | "Parfum" | "Extrait",
  olfactoryFamily: ["ámbar", "amaderado"],
  notes: { top: ["bergamota"], heart: ["rosa"], base: ["vainilla", "oud"] },
  house: "nicho" | "disenador" | "arabe",   // tipo de perfumería (una sola)
  categoryIds: ["sets"],                     // secciones manuales extra
  variants: [
    { id: "d3",   type: "decant", ml: 3,   price: 18999,  compareAtPrice: null,   available: true },
    { id: "d5",   type: "decant", ml: 5,   price: 27999,  compareAtPrice: null,   available: true },
    { id: "d10",  type: "decant", ml: 10,  price: 49999,  compareAtPrice: null,   available: true },
    { id: "f100", type: "frasco", ml: 100, price: 289000, compareAtPrice: 320000, available: true,
      condition: "nuevo" | "tester" }   // solo aplica a frascos
  ],
  // Derivados en el build (no se guardan a mano):
  //   hasDecants = algún variant.type == "decant"  → el perfume entra solo en la colección "Decants"
  //   hasBottle  = algún variant.type == "frasco"
  //   priceFrom  = precio más bajo disponible (para "Desde $18.999" en las tarjetas)
  badges: ["nuevo", "bajo-encargo", "preventa"],   // "oferta" se calcula sola por compareAtPrice
  leadTime: "8 a 15 días hábiles",               // solo para bajo encargo / preventa
  images: [{ publicId: "excentrix/perfumes/dynasty-1", alt, width, height, kind: "producto" | "ambiente" }], // la URL se arma con publicId + transformaciones
  featured: true,
  status: "draft" | "published",
  sortOrder: 10,
  seo: { title?, description? },
  createdAt, updatedAt
}
```

### `categories/{id}` — secciones del menú
```ts
{ name: "Nicho", slug: "nicho", description, image, parentId: null,
  showInMenu: true, menuOrder: 4,
  rule: "manual" | "auto" }   // auto = se llena sola según una regla fija (ver tabla)
```

### Menú inicial (decidido)

En escritorio, de izquierda a derecha:

`NUEVOS` · `OFERTAS` · `GÉNERO ▾` · `NICHO` · `DISEÑADOR` · `ÁRABE` · `DECANTS` · `SETS` · `BAJO ENCARGO`

| Sección | Slug | Cómo se llena |
|---|---|---|
| Nuevos lanzamientos | `nuevos-lanzamientos` | **Automática:** perfumes con la etiqueta "nuevo" |
| Ofertas | `ofertas` | **Automática:** perfumes con alguna presentación que tenga precio anterior tachado |
| Género ▾ → Hombre / Mujer / Unisex | `hombre` · `mujer` · `unisex` | **Automática:** según el campo `gender` |
| Nicho | `nicho` | Manual: la asignas en el perfume |
| Diseñador | `disenador` | Manual |
| Árabe | `arabe` | Manual |
| Decants | `decants` | **Automática:** perfumes con al menos un decant |
| Sets | `sets` | Manual |
| Bajo encargo | `bajo-encargo` | **Automática:** perfumes con la etiqueta "bajo encargo" |

Las automáticas te evitan trabajo y nunca quedan desactualizadas: si quitas el precio tachado, el
perfume sale solo de Ofertas. Nicho, Diseñador y Árabe son el **tipo de perfumería** y se eligen como
un campo único en el perfume (un perfume es de uno solo de los tres). Sets es una etiqueta aparte.

En móvil, el menú es un panel lateral con las mismas secciones y Género desplegable. Desde el admin
puedes renombrar, reordenar, ocultar y crear secciones manuales nuevas (por ejemplo "Regalos" o
"Verano") sin tocar código.

**Frascos y decants:** un perfume es un solo producto con varias presentaciones, no dos productos
separados. "Decants" es una colección automática: incluye todo perfume que tenga al menos una
presentación decant, sin que tengas que asignarla a mano.

### Ajustes de presentaciones (en `settings/site`)
```ts
decantSizes: [3, 5, 10],        // tamaños estándar que ofreces en decant (editables)
bottleSizes: [30, 50, 100, 200] // tamaños de frasco más comunes, para crear variantes rápido
```

### `brands/{id}`
```ts
{ name: "Lattafa", slug: "lattafa", logo?, country?, description? }
```

### `banners/{id}` — carrusel del inicio
```ts
{ title, imageDesktop, imageMobile, link, active: true, order: 1 }
```

### `settings/site` — ajustes globales
```ts
{
  whatsappNumber: "57XXXXXXXXXX",
  whatsappGreeting: "Hola Excentrix, quiero comprar:",
  announcementBar: { text: "Envío gratis por compras desde $179.999", active: true },
  social: { instagram, tiktok },
  currency: "COP"
}
```

### Reglas de seguridad (resumen)
- Lectura pública: solo `perfumes` con `status == "published"`, y `categories`, `brands`, `banners`,
  `settings`.
- Escritura: solo usuarios con custom claim `admin: true`.
- Imágenes (Cloudinary): solo subidas firmadas por el Worker, que exige token de admin. Preset de
  subida limitado a la carpeta `excentrix/`, formatos jpg/png/webp/avif y máximo 5 MB.
- Admin: `settings/publish` guarda cuándo y quién publicó por última vez.
- Registro de usuarios deshabilitado: la cuenta admin se crea a mano. Login con correo + contraseña y,
  opcionalmente, segundo factor.

---

## 5. Mapa del sitio público

| Ruta | Contenido |
|---|---|
| `/` | Barra de anuncio · header (logo, menú, buscador) · carrusel de banners · accesos a colecciones (tarjetas editoriales) · Nuevos lanzamientos · Por género · Marcas destacadas · bloque "¿Qué es un decant?" · cómo comprar (3 pasos hasta WhatsApp) · Instagram/testimonios · footer |
| `/coleccion/[slug]` | Grid de perfumes · filtros (género, marca, familia olfativa, presentación: decant o frasco, tamaño, rango de precio) · orden (destacados, precio, novedades) |
| `/perfume/[slug]` | Galería con zoom · marca · nombre · selector en dos grupos ("Decant 3 · 5 · 10 ml" y "Frasco completo 100 ml") con precio · enlace a "¿Qué es un decant?" · botón principal "Comprar por WhatsApp" · pirámide olfativa (salida / corazón / fondo) · descripción · relacionados |
| `/marcas` y `/marca/[slug]` | Índice de marcas y sus perfumes |
| `/buscar` | Resultados de Pagefind |
| `/que-es-un-decant` | Página educativa |
| `/como-comprar`, `/envios`, `/terminos`, `/privacidad` | Páginas legales y de confianza |
| `404` | Con sugerencias de perfumes |

### Precios (decidido: visibles para todos)

| Caso | Cómo se muestra |
|---|---|
| Formato | Pesos colombianos con punto de miles y sin decimales: `$49.999` (`Intl.NumberFormat("es-CO")`) |
| Tarjeta del catálogo | `Desde $18.999` = precio más bajo disponible entre decants y frascos |
| Ficha del perfume | El precio cambia al elegir la presentación |
| Oferta | Precio actual en carmesí y anterior tachado en gris: `$289.000` ~~`$320.000`~~ · insignia `-10 %` |
| Presentación agotada | Píldora atenuada con "Agotado"; el botón cambia a "Preguntar disponibilidad" |
| Perfume sin ninguna presentación disponible | La tarjeta muestra "Agotado" y el perfume baja al final de la colección |
| Bajo encargo / preventa | Se muestra el precio + insignia y una línea con el tiempo estimado de entrega (editable por perfume) |

Mostrar precios también permite publicar los datos estructurados `Offer` (precio, moneda,
disponibilidad), con lo que Google puede mostrar el precio directamente en los resultados de búsqueda.
Al ordenar por precio y filtrar por rango se usa el precio más bajo disponible.

### Flujo de compra (WhatsApp)

Compra directa, un perfume a la vez (sin bolsa ni carrito):

1. El cliente entra a la ficha del perfume y elige el tamaño (el precio cambia al instante).
2. Pulsa **"Comprar por WhatsApp"**. Si el tamaño está agotado, el botón cambia a
   "Preguntar disponibilidad".
3. Se abre `https://wa.me/57XXXXXXXXXX?text=…` con:
   ```
   Hola Excentrix, quiero comprar:
   Dynasty – Lattafa · Decant 10 ml — $49.999
   https://excentrix.web.app/perfume/dynasty-lattafa
   ```
   El enlace permite al vendedor ver exactamente qué perfume pidió el cliente.
4. En las tarjetas del catálogo también hay un acceso rápido a WhatsApp que usa el tamaño más pequeño
   disponible, o lleva a la ficha si el perfume tiene varios tamaños.
5. Si el cliente quiere varios perfumes, lo resuelve en la misma conversación de WhatsApp con el
   vendedor.
6. Se registra un evento de analítica `click_whatsapp` con el perfume y el tamaño (sin datos personales).

---

## 6. Dashboard de administrador (`/admin`)

No indexado (`noindex`, fuera del sitemap), protegido por Firebase Auth.

| Módulo | Funciones |
|---|---|
| **Resumen** | Total de perfumes publicados / borradores, agotados, último build y su estado |
| **Perfumes** | Tabla con búsqueda y filtros · crear/editar · subir y ordenar imágenes (arrastrar) · presentaciones: botón "Agregar decants estándar" (crea 3/5/10 ml de una vez, solo pones precios) + frascos con tamaño, precio y condición nuevo/tester · marcar agotado por presentación · asignar categorías y etiquetas · borrador/publicado · duplicar perfume |
| **Categorías** | Crear/editar · ordenar el menú arrastrando · mostrar/ocultar en el menú |
| **Marcas** | Crear/editar con logo |
| **Banners** | Subir imagen escritorio/móvil, enlace, orden, activar |
| **Ajustes** | Número de WhatsApp, saludo del mensaje, barra de anuncio, redes |
| **Publicar** | Botón "Publicar cambios" con estado del build (en curso / listo / error) |

Detalles de calidad: autoguardado de borradores, vista previa del perfume, slug automático,
validación Zod con mensajes claros, compresión de imágenes en el navegador antes de subir (ahorra
créditos de Cloudinary), y al borrar un perfume se borran también sus imágenes en Cloudinary.

---

## 7. Sistema de diseño

### Dirección de arte
"Lujo oscuro editorial": mucho espacio en blanco, tipografía serif de alto contraste, fotografía de
producto sobre fondos limpios, y el humo rojo/negro del logo como recurso gráfico de acento.
Referencias de tono: casas de perfumería de nicho, no tiendas de descuento.

### Paleta (regla 60 / 30 / 10)

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#F7F5F2` | Fondo principal (blanco hueso, como el papel del logo) — 60 % |
| `--white` | `#FFFFFF` | Tarjetas, superficies |
| `--ink` | `#0E0E0E` | Texto, header, footer, secciones oscuras — 30 % |
| `--ink-soft` | `#5E5A57` | Texto secundario |
| `--line` | `#E4E0DB` | Bordes, divisores |
| `--crimson` | `#8E1B24` | Rojo de marca: CTAs, precios en oferta, acentos — 10 % |
| `--crimson-hover` | `#A8222D` | Hover de botones rojos |
| `--whatsapp` | `#25D366` | Solo en el botón flotante, nunca como color de marca |

Contraste verificado WCAG AA: tinta sobre papel y blanco sobre carmesí superan 4.5:1.

### Tipografía
- **Títulos:** *Lora* (500/600), la misma fuente con la que se reconstruyó "Excentrix" en el logo.
- **Interfaz y cuerpo:** *Montserrat* (400/500), la misma de "PERFUMERÍA"; mayúsculas con tracking
  amplio (~0.28–0.38 em) para etiquetas y botones.
- Carmesí sobre fondo negro no alcanza contraste para texto (~2.1:1): en secciones oscuras, el texto
  de acento usa una variante más clara, `#C8323E`.
- Escala modular 1.25, precios en cifras tabulares.

### Componentes clave
Header pegajoso que se compacta al hacer scroll · mega menú por secciones · tarjeta de perfume
(imagen, marca en versalitas, nombre en serif, "desde $X", insignias Nuevo/Oferta/Preventa) · selector
de tamaño tipo píldoras · botón "Comprar por WhatsApp" · pirámide olfativa ilustrada · botón flotante de WhatsApp.

### Movimiento
Transiciones entre páginas con View Transitions de Astro (la imagen del perfume "viaja" de la tarjeta a
la ficha) · aparición suave al hacer scroll · hover con cambio a segunda foto. Todo respeta
`prefers-reduced-motion`.

### Logo — vectorización (decidido: hay que hacerla)

La imagen actual es un JPG de 1280×714 sobre fondo de papel texturizado. El logo tiene dos partes que
se tratan de forma distinta:

| Parte | Cómo se vectoriza | Calidad esperada |
|---|---|---|
| **Logotipo** ("Excentrix" + "PERFUMERÍA") | Se **reconstruye con tipografía real**: se identifica la serif del nombre (o la más cercana en Google Fonts) y la sans espaciada de "PERFUMERÍA", se componen y se convierten a trazos | Perfecta, nítida a cualquier tamaño |
| **Isotipo** (frasco + grietas + humo rojo/negro) | Opción A: **trazado automático** (potrace/Inkscape, por color: negro y carmesí) y limpieza a mano de nodos | Buena para web y redes; los remolinos finos pueden perder detalle |
|  | Opción B: **redibujo manual** por un diseñador en Illustrator | Profesional, apto para imprimir (etiquetas, bolsas, tarjetas) |

**Recomendación:** opción A ya, para no frenar el desarrollo, y opción B antes de imprimir cualquier
material físico. Si tienes la imagen original en mayor resolución (la que generaste antes del JPG),
el trazado automático sale bastante mejor.

**Paquete de marca a entregar** (en `public/brand/`):
1. `logo-completo.svg` — isotipo arriba, nombre abajo (como la imagen actual).
2. `logo-horizontal.svg` — isotipo a la izquierda y nombre a la derecha, para el header.
3. `isotipo.svg` — solo frasco + humo.
4. Variantes **negativas** (blanco + carmesí) de las tres, para fondos negros.
5. Favicon (`favicon.svg` + `favicon.ico` 32 px) y ícono de app 512 px. A tamaño pequeño, el humo se
   simplifica: frasco negro con una sola llama carmesí.
6. Imagen Open Graph 1200×630 para cuando compartan enlaces por WhatsApp o redes.
7. Colores oficiales extraídos del logo y verificados contra la paleta de la sección 7.

Reglas de uso: el fondo de papel texturizado **no** es parte del logo (en la web el fondo lo pone
`--paper`); área de respeto mínima igual a la altura de la "E"; tamaño mínimo del logo completo: 120 px
de ancho.

### Fotografía de producto (decidido: fotos de las marcas)

Las fotos oficiales vienen con fondos, encuadres y tamaños distintos. Mezcladas sin tratamiento, el
catálogo se ve desordenado; con estas reglas se ve como una sola sesión de fotos:

**De dónde sacarlas**
- Preferir las imágenes oficiales de la marca o del distribuidor (kits de prensa, sitio oficial), con
  **fondo blanco o transparente (PNG)**, de al menos 1000 px de lado.
- **No** tomar fotos de otras tiendas (Jordania incluida): esas fotos suelen ser propias de cada
  tienda y usarlas puede traer reclamos. Las imágenes oficiales de producto se usan comúnmente para
  revender ese producto, pero el derecho sigue siendo de la marca.
- Con el tiempo, reemplazar los perfumes más vendidos por fotos propias (más confianza y mejor
  posicionamiento en Google, porque la imagen no está repetida en mil sitios).

**Cómo se unifican (automático, con Cloudinary)**
Cada foto se entrega con la misma transformación, sin editarla a mano:

```
e_trim            → recorta el borde sobrante alrededor del frasco
c_pad,ar_4:5      → encuadre vertical 4:5 igual para todos, frasco centrado
b_white           → fondo blanco (la tarjeta también es blanca, así no se nota el borde de la foto)
w_auto,f_auto,q_auto → tamaño, formato y calidad según la pantalla
```

Así todas las tarjetas tienen la misma proporción, el frasco del mismo tamaño aparente y el mismo
fondo, aunque las fotos originales sean distintas. Las fotos con fondo de color o de ambiente (no
blanco) se marcan en el admin como **"foto de ambiente"** y se usan como segunda imagen (la que aparece
al pasar el mouse) o en la galería, nunca como principal.

**En el admin**
- Vista previa de cómo queda la tarjeta con la transformación aplicada antes de guardar.
- Aviso si la imagen mide menos de 1000 px o si el fondo no es claro.
- Texto alternativo sugerido automáticamente: "Perfume {nombre} de {marca}, frasco de {ml} ml".

**Aporte propio de Excentrix:** como las fotos de producto no son exclusivas, la identidad la dan
los banners, las portadas de colección y las redes. Para eso se recomienda una pequeña sesión propia
(o imágenes editoriales con el humo rojo/negro del logo) para el inicio y las colecciones.

---

## 8. Infraestructura profesional

- **Repositorio GitHub** con ramas `main` (producción) y ramas de trabajo con Pull Request.
- **CI en cada PR:** lint (ESLint), formato (Prettier), `astro check` (tipos), build, y un **canal de
  preview** de Firebase Hosting con URL temporal para revisar antes de publicar.
- **CD en `main`:** build + deploy automático a producción.
- **Rebuild desde el admin:** Cloudflare Worker (verifica token de admin) → `repository_dispatch` de
  GitHub. Límite de 1 publicación por minuto para evitar builds repetidos.
- **Dos proyectos Firebase:** `excentrix-dev` (pruebas) y `excentrix-prod` (real). Emuladores de
  Firebase para desarrollo local.
- **Secretos** solo en GitHub Secrets / Secret Manager; nunca en el repositorio.
- **Calidad medida:** Lighthouse CI con presupuesto ≥ 95 en Performance, Accesibilidad, SEO y Buenas
  prácticas.
- **SEO:** sitemap, `robots.txt`, URL canónicas, datos estructurados `Product` y `Offer` (JSON-LD),
  Open Graph por perfume, breadcrumbs.
- **Respaldos:** la exportación nativa de Firestore requiere Blaze, así que un workflow semanal de
  GitHub Actions exporta todas las colecciones a JSON y lo guarda como respaldo. Las imágenes ya
  quedan respaldadas en Cloudinary.
- **Seguridad:** reglas de Firestore con pruebas automáticas, App Check en el admin, CORS del Worker
  limitado a `PUBLIC_SITE_URL` (y localhost en desarrollo), cabeceras de seguridad en `firebase.json`.

### Estructura del repositorio (modular por dominio — detalle en ARQUITECTURA.md)
```
excentrix/
├─ src/
│  ├─ pages/           # rutas delgadas, sin lógica de negocio
│  ├─ modules/
│  │  ├─ catalog/      # colecciones, filtros, tarjeta, secciones automáticas
│  │  ├─ product/      # ficha, galería, selector de presentaciones, pirámide olfativa
│  │  ├─ whatsapp/     # mensaje, enlace wa.me, botones de compra
│  │  ├─ search/       # Pagefind
│  │  ├─ content/      # inicio, decants, legales, banners
│  │  └─ admin/        # dashboard React
│  └─ shared/          # config, lib, layouts, styles (tokens), ui genérica
├─ worker/             # Cloudflare Worker: firma de Cloudinary + publicar
├─ public/             # favicon, logo SVG, OG
├─ firestore.rules · firebase.json
└─ .github/workflows/  # ci.yml · deploy.yml · rebuild.yml · backup.yml
```

---

## 9. Hoja de ruta

| Fase | Entregable | Duración estimada |
|---|---|---|
| **0. Fundaciones** | Logo en SVG, proyectos Firebase (Spark), cuentas Cloudinary y Cloudflare, repo, CI/CD, tokens de diseño | 2–3 días |
| **1. Diseño** | Maquetas de inicio, colección, ficha de perfume (móvil primero) y del admin | 3–5 días |
| **2. Datos + admin** | Esquemas, reglas de seguridad, login, Worker de firma, CRUD de perfumes/categorías/marcas/banners/ajustes, subida a Cloudinary | 5–7 días |
| **3. Sitio público** | Inicio, colecciones con filtros, ficha, flujo WhatsApp, búsqueda | 5–7 días |
| **4. Publicación** | Botón "Publicar" + endpoint del Worker + workflow de rebuild y de respaldo | 1–2 días |
| **5. Pulido y lanzamiento** | SEO, analítica, accesibilidad, Lighthouse, carga del catálogo real, publicación en `excentrix.web.app` | 2–4 días |

Total aproximado: 3–4 semanas de trabajo enfocado.

**Criterios de "terminado" para la v1:**
- Puedes crear un perfume con fotos y 3 tamaños en el admin, publicarlo y verlo en el sitio en < 3 min.
- Un cliente en móvil llega a WhatsApp con perfume, tamaño y precio en ≤ 2 toques desde la ficha.
- Lighthouse ≥ 95 en las 4 métricas en móvil.
- Nadie sin la cuenta admin puede escribir datos (verificado con pruebas de reglas).

---

## 10. Decisiones pendientes (tuyas)

1. ~~Plan Blaze o Cloudinary~~ → **Decidido: Cloudinary + Firebase Spark + Cloudflare Worker.**
2. **Número de WhatsApp Business** del vendedor (formato `57XXXXXXXXXX`).
3. ~~Bolsa o compra directa~~ → **Decidido: solo compra directa por WhatsApp, un perfume a la vez.**
4. ~~Tamaños~~ → **Decidido: frascos completos y decants (3 / 5 / 10 ml por defecto, editables).**
5. ~~Menú~~ → **Decidido:** Nuevos · Ofertas · Género (Hombre/Mujer/Unisex) · Nicho · Diseñador · Árabe · Decants · Sets · Bajo encargo.
6. ~~Dominio~~ → **Decidido: `excentrix.web.app` para el lanzamiento; dominio propio más adelante.**
7. ~~Logo en SVG~~ → **Decidido: hay que vectorizarlo** (logotipo con tipografía real + isotipo trazado; redibujo profesional antes de imprimir).
8. ~~Fotos de producto~~ → **Decidido: fotos oficiales de las marcas**, unificadas con Cloudinary (4:5, fondo blanco sobre tarjeta blanca).
9. ~~Precios~~ → **Decidido: precios visibles** (ver "Precios" en la sección 5).
