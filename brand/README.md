# Excentrix Perfumería: paquete de marca (borrador vectorial)

> **Estado: primer borrador.** El isotipo se obtuvo con un **auto-trazado** del JPG original.
> Sirve para web y pantalla. **Antes de imprimir** (packaging, etiquetas, vinilo, bordado),
> se recomienda que un diseñador lo **redibuje a mano** (ver "Limitaciones").

## Colores de marca

| Token   | HEX       | Uso |
|---------|-----------|-----|
| ink     | `#0E0E0E` | botella, wordmark, fondo oscuro |
| crimson | `#8E1B24` | humo/llamas, "PERFUMERÍA" |
| paper   | `#F7F5F2` | fondo claro |
| white   | `#FFFFFF` | tinta en las variantes negativas |

## Archivos

### `brand/` (fuente de verdad)

| Archivo | Qué es |
|---|---|
| `source/logo-original.jpeg` | Logo original (raster, 1280×714). No se modifica. |
| `isotipo.svg` | Botella + humo, auto-trazado, fondo transparente. Tinta + carmesí. |
| `isotipo-negativo.svg` | Igual, con la tinta en blanco para fondos oscuros. Las grietas blancas de la botella son huecos transparentes, así que se ve el fondo. |
| `logo-completo.svg` | Isotipo arriba y wordmark abajo, con las mismas posiciones y proporciones del original. |
| `logo-completo-negativo.svg` | Variante para fondo oscuro (tinta → blanco, el carmesí no cambia). |
| `logo-horizontal.svg` | Isotipo a la izquierda y wordmark a la derecha (bloque de texto = 70 % de la altura del isotipo). Pensado para un header de ~56 px (logo a 40-48 px de alto). |
| `logo-horizontal-negativo.svg` | Variante horizontal para fondo oscuro. |
| `favicon.svg` | Isotipo **simplificado** y dibujado a mano (botella + grieta diagonal + una sola llama carmesí). Incluye `@media (prefers-color-scheme: dark)`: en pestañas oscuras la botella pasa a blanco y la llama a un carmesí más claro (`#C8323E`). |
| `fonts/` | Fuentes OFL descargadas de `github.com/google/fonts` (variables `[wght]`) con sus licencias `OFL-*.txt`, y `fonts.conf` (fontconfig privado para que Inkscape las use sin instalarlas). Se conservan también las candidatas que se descartaron. |
| `build.py` | Pipeline reproducible que regenera todo lo anterior. |
| `previews/` | PNG de cada SVG sobre papel (`--papel`) y sobre tinta (`--tinta`), comparaciones con el original, el favicon a 16/32 px ampliado ×8 y una simulación del header de 56 px. |
| `work/` | Archivos intermedios (máscaras PBM, salidas de potrace, caché de fontconfig). Se puede borrar sin problema: se regenera. |

### `public/brand/` (lo que sirve la web)

`logo-completo(.svg|-negativo.svg)`, `logo-horizontal(.svg|-negativo.svg)`, `isotipo(.svg|-negativo.svg)`, `favicon.svg`, y además:

| Archivo | Detalle |
|---|---|
| `favicon.ico` | 16 + 32 + 48 px, fondo transparente |
| `icon-512.png` | 512×512, fondo papel, icono al 72 % (PWA/manifest) |
| `apple-touch-icon.png` | 180×180, fondo papel |
| `og-default.png` | 1200×630, fondo `#0E0E0E` con el logo completo negativo centrado (440 px de alto) |

Ejemplo de uso en `<head>`:

```html
<link rel="icon" href="/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/brand/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png">
<meta property="og:image" content="/brand/og-default.png">
```

## Tipografías (wordmark reconstruido, no trazado)

Las letras **no se trazaron**: se recompusieron con fuentes reales y luego se convirtieron a
trazos con Inkscape (`--export-text-to-path --export-plain-svg`). Los SVG finales **no dependen de
ninguna fuente** (no contienen `<text>`).

| Línea | Fuente elegida | Ajuste | Por qué |
|---|---|---|---|
| **Excentrix** | **Lora Medium (500)**, OFL | tracking 0, cuerpo 122.87 px (en coordenadas del JPG), ajustado al ancho del original (545 px) | Se renderizaron Cormorant Garamond 600/700, Playfair Display 400, Libre Caslon Text 400 y Lora 400/500, todas escaladas al mismo ancho que el original. Lora tiene la misma altura de x (grande), el mismo contraste moderado, una "c" con terminal en gota y una "x" con serifas parecidas. A peso 500, el grosor del asta (13 px frente a 14 px) y la mancha de tinta (~27 %) coinciden con el original. Cormorant tiene la x demasiado baja, Playfair un contraste excesivo y Caslon es más ancha. |
| **PERFUMERÍA** | **Montserrat Regular (400)**, OFL | letter-spacing **0.376 em** (14.52 px sobre un cuerpo de 38.57 px), altura de mayúscula 27 px | Montserrat comparte con el original las proporciones anchas, la "M" de lados rectos y la "R". En el original el asta mide unos 3 px con 27 px de mayúscula: Light (300) da 2.1 px y queda fino, Regular (400) da 2.85 px. Jost y Josefin son más estrechas y necesitarían más de 0.6 em de tracking para llenar el mismo ancho. |

Para CSS en la web: `font-family: "Lora"; font-weight: 500` para títulos de marca y
`font-family: "Montserrat"; font-weight: 400; letter-spacing: .376em; text-transform: uppercase`
para el descriptor.

## Cómo regenerar

```bash
python3 brand/build.py
```

Requisitos: python3 con Pillow y numpy, potrace 1.16, Inkscape ≥ 1.2 (CLI) e ImageMagick 7.
Tarda unos 10 s. Todos los parámetros están al principio de `build.py`.

### Pipeline del isotipo (auto-trazado)

1. **Recorte** del JPG: `x 500–840, y 66–498`. El corte inferior queda justo antes de la altura
   de mayúscula del wordmark (y = 499); la punta del humo que bajaba hasta la "e" se recorta.
2. **Ampliación ×4** (Lanczos) y desenfoque gaussiano de 0.8 px para suavizar el JPEG y la textura del papel.
3. **Separación por color mediante desmezcla lineal.** La tinta y el carmesí tienen casi el mismo
   canal verde (~30) y el papel ~238. Por eso el verde da la *cobertura* α de cualquier tinta
   (`α = (238 − G) / (238 − 30)`) y un píxel es tinta si α > 0.5, lo que conserva los grosores.
   Con esa cobertura, el rojo decide: si `R > α·(29+107)/2 + (1−α)·240` es carmesí, si no, negro.
   Así se elimina el papel y su textura y los trazos finos no engordan. (Un primer intento con
   umbrales de luminancia + cierre morfológico engordaba el carmesí y cerraba los huecos blancos.)
4. **Capa base sin costuras:** la capa de tinta se extiende 7 px (ampliados) por debajo del
   carmesí adyacente. El carmesí se dibuja encima, así que no aparecen líneas de fondo entre colores.
5. **potrace** por capa: `potrace -s --flat -t 60 -a 1.0 -O 0.35 -u 10`
   (`-t 60` ≈ descarta manchas de < 4 px² reales).
6. **Recoloreado** a `#0E0E0E` / `#8E1B24` (o `#FFFFFF` en el negativo), unión en un solo SVG y
   viewBox ajustado a la caja del trazo + 2 px.

### Wordmark

Se mide cada texto con `inkscape --query-*` y se escala o espacia para que encaje exactamente en
la caja que ocupa en el original: "Excentrix" en `x 367–912`, línea base 589; "PERFUMERÍA" en
`x 444–836`, línea base 643, mayúscula de 27 px.

## Limitaciones conocidas (honestas)

- **Detalle del humo:** en el original, los trazos carmesí tienen degradados internos hacia el
  negro (volumen). El trazo vectorial es plano en dos tintas, así que esos degradados quedan como
  manchas negras irregulares dentro de algunas volutas, o desaparecen.
- **Bordes:** el JPG mide solo ~320×430 px en la zona del isotipo. Al ampliarlo, algunos bordes
  tinta/carmesí salen ligeramente dentados o "temblorosos" y algunas volutas muy finas pierden la
  punta o se unen.
- **Tapón:** el bisel blanco interior del tapón (un rectángulo fino) solo se conserva en parte:
  quedan las líneas superior e inferior; los laterales son muy cortos.
- **Gotas de salpicadura:** se eliminan las de menos de ~4 px² del original (`turdsize`).
- **Tamaño de los SVG:** ~50-60 KB por los muchos nodos. Se puede reducir con SVGO o con un redibujo.
- **Contraste en negativo:** "PERFUMERÍA" y el humo en `#8E1B24` sobre `#0E0E0E` tienen un
  contraste bajo (~2:1, no cumple WCAG para texto). Se mantuvo el carmesí por especificación. Si
  se usa el logo negativo pequeño (header oscuro), conviene una variante con carmesí aclarado
  (p. ej. `#C8323E`, el mismo que usa el favicon en modo oscuro).
- **Favicon:** es una **reinterpretación** simplificada, no un trazado: botella, grieta y llama.
  Se lee a 32 px; a 16 px apenas queda la silueta de la botella con una mancha carmesí.
- **Horizontal a 40-48 px:** el humo se convierte en textura y "PERFUMERÍA" queda en ~6-7 px de
  mayúscula. Para headers muy pequeños se puede valorar el favicon + "Excentrix" en solitario.

**Recomendación:** antes de cualquier aplicación impresa o de gran formato, encargar un
**redibujo vectorial manual** del isotipo (curvas limpias, pocos nodos, grosores consistentes,
decidir qué degradados del humo se convierten en formas), usando estos SVG solo como guía.
