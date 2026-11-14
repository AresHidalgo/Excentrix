#!/usr/bin/env python3
"""Excentrix Perfumeria - pipeline reproducible del paquete de marca (borrador vectorial).

Uso:  python3 brand/build.py        (desde cualquier carpeta)

Requisitos: python3 + Pillow + numpy, potrace >= 1.16, Inkscape >= 1.2 (CLI),
ImageMagick 7 (`magick`). Las fuentes OFL viven en brand/fonts/ y se cargan con
un fontconfig privado (brand/fonts/fonts.conf), sin instalarlas en el sistema.

Etapas:
 1. Isotipo: recorte del isotipo del JPG original -> ampliacion x4 -> separacion
    por color (tinta / carmesi / papel) -> limpieza morfologica -> potrace por capa
    -> recoloreado a colores exactos de marca -> SVG con fondo transparente.
 2. Wordmark: texto real (Lora Medium + Montserrat Regular) convertido a trazos
    con Inkscape (--export-text-to-path), ajustado a la posicion/tamano del original.
 3. Composiciones (completo, horizontal) + variantes negativas.
 4. Favicon simplificado (dibujado a mano, geometrico) + ICO/PNG.
 5. Imagen Open Graph 1200x630.
 6. Copias a public/brand/ y previews PNG en brand/previews/.
"""
import os
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "source", "logo-original.jpeg")
WORK = os.path.join(HERE, "work")
PREV = os.path.join(HERE, "previews")
PUB = os.path.normpath(os.path.join(HERE, "..", "public", "brand"))
FONTCONF = os.path.join(HERE, "fonts", "fonts.conf")

INK = "#0E0E0E"
CRIMSON = "#8E1B24"
PAPER = "#F7F5F2"
WHITE = "#FFFFFF"

# ---------------------------------------------------------------- parametros
# Recorte del isotipo en pixeles del original (x0, y0, x1, y1). y1 se corta justo
# antes de la altura de mayusculas del wordmark (y=499) para no arrastrar letras.
ISO_CROP = (500, 66, 840, 498)
UPSCALE = 4            # ampliacion Lanczos antes de trazar (curvas mas suaves)
PRE_BLUR = 0.8         # desenfoque gaussiano (px ampliados) contra ruido JPEG/papel
PAPER_G, PAPER_R = 238.0, 240.0   # verde/rojo medios del papel en el JPG
FG_G = 30.0            # verde de la tinta y del carmesi (ambos ~30)
INK_R, CRIMSON_R = 29.0, 107.0    # rojo medio de tinta / carmesi en el JPG
COVERAGE = 0.5         # cobertura minima para considerar un pixel "tinta" (0.5 = conserva grosores)
TURDSIZE = 60          # potrace -t: descarta manchas < N px (en pixeles ampliados = ~4 px reales)
ALPHAMAX = 1.0         # potrace -a: suavidad de esquinas (0 = poligonal, 1.334 = sin esquinas)
OPTTOL = 0.35          # potrace -O: tolerancia de optimizacion de curvas
UNDERLAP = 7           # px ampliados que la capa tinta se extiende bajo el carmesi (evita costuras)

# Wordmark: caja que ocupa cada linea en el original (px). Se ajusta el texto real a ella.
WORD_BOX = (367, 912, 589)        # Excentrix: x izq, x der, linea base
SUB_BOX = (444, 836, 643, 27.0)   # PERFUMERIA: x izq, x der, linea base, altura de mayuscula
WORD_FONT = ("Lora", 500)
SUB_FONT = ("Montserrat", 400)


def run(cmd, **kw):
    env = dict(os.environ, FONTCONFIG_FILE=FONTCONF)
    return subprocess.run(cmd, check=True, capture_output=True, text=True, env=env, **kw)


# ======================================================================= 1 ISOTIPO
def iso_masks():
    x0, y0, x1, y1 = ISO_CROP
    im = Image.open(SRC).convert("RGB").crop(ISO_CROP)
    im = im.resize(((x1 - x0) * UPSCALE, (y1 - y0) * UPSCALE), Image.LANCZOS)
    im = im.filter(ImageFilter.GaussianBlur(PRE_BLUR))
    a = np.asarray(im).astype(np.float32)
    r, g = a[..., 0], a[..., 1]
    # Desmezcla lineal: tinta y carmesi tienen casi el mismo verde (~30) y el papel ~238,
    # asi que el verde da la "cobertura" (alpha) de cualquier tinta; el rojo, dada esa
    # cobertura, decide si la tinta es negra (R~29) o carmesi (R~107).
    alpha = np.clip((PAPER_G - g) / (PAPER_G - FG_G), 0, 1)
    fg = alpha > COVERAGE
    r_mid = alpha * (INK_R + CRIMSON_R) / 2 + (1 - alpha) * PAPER_R
    crimson = fg & (r > r_mid)
    ink = fg & ~crimson

    def morph(mask, f):
        return np.asarray(Image.fromarray(mask.astype(np.uint8) * 255).filter(f)) > 127

    # capa base: tinta + un borde de tinta bajo el carmesi adyacente (sin costuras al renderizar)
    base = ink | (crimson & morph(ink, ImageFilter.MaxFilter(UNDERLAP)))
    return base, crimson


def potrace_path(mask, name):
    pbm = os.path.join(WORK, name + ".pbm")
    out = os.path.join(WORK, name + ".svg")
    Image.fromarray(np.where(mask, 0, 255).astype(np.uint8)).convert("1").save(pbm)
    run(["potrace", "-s", "--flat", "-t", str(TURDSIZE), "-a", str(ALPHAMAX),
         "-O", str(OPTTOL), "-u", "10", "-o", out, pbm])
    svg = open(out).read()
    ds = re.findall(r'\sd="([^"]+)"', svg)
    return " ".join(d.replace("\n", " ") for d in ds)


def build_isotype():
    base, crimson = iso_masks()
    ink_d = potrace_path(base, "iso-ink")
    red_d = potrace_path(crimson, "iso-crimson")
    x0, y0, x1, y1 = ISO_CROP
    hpx = (y1 - y0)
    s = 0.1 / UPSCALE
    # potrace: origen abajo-izquierda, unidades 1/10 px ampliado -> coords del JPG original
    tr = f"translate({x0},{y0 + hpx}) scale({s:.6f},{-s:.6f})"
    union = base | crimson
    ys, xs = np.where(union)
    bbox = (x0 + xs.min() / UPSCALE, y0 + ys.min() / UPSCALE,
            x0 + (xs.max() + 1) / UPSCALE, y0 + (ys.max() + 1) / UPSCALE)
    return {"tr": tr, "ink": ink_d, "red": red_d, "bbox": bbox}


def iso_group(iso, ink, red, extra=""):
    return (f'<g transform="{(extra + " " + iso["tr"]).strip()}">'
            f'<path fill="{ink}" d="{iso["ink"]}"/>'
            f'<path fill="{red}" d="{iso["red"]}"/></g>')


# ===================================================================== 2 WORDMARK
def text_to_paths(name, family, weight, size, text, spacing=0.0):
    src = os.path.join(WORK, name + "-text.svg")
    out = os.path.join(WORK, name + "-paths.svg")
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="400" viewBox="0 0 2000 400">'
           f'<text id="t" x="100" y="300" style="font-family:\'{family}\';font-weight:{weight};'
           f'font-size:{size}px;letter-spacing:{spacing}px;fill:#000000">{text}</text></svg>')
    open(src, "w", encoding="utf-8").write(svg)
    run(["inkscape", src, "--export-text-to-path", "--export-plain-svg",
         "--export-type=svg", "-o", out])
    q = run(["inkscape", "--query-id=t", "--query-x", "--query-y", "--query-width",
             "--query-height", out]).stdout.split()
    bx, by, bw, bh = map(float, q)
    root = ET.parse(out).getroot()
    ns = "{http://www.w3.org/2000/svg}"
    ds = []
    for p in root.iter(ns + "path"):
        d = p.get("d")
        tr = p.get("transform")
        ds.append((d, tr))
    return ds, (bx, by, bw, bh)


def build_wordmark():
    fam, wt = WORD_FONT
    lx, rx, base = WORD_BOX
    target_w = rx - lx
    # 1a pasada a 100px para medir; luego escalar al ancho del original
    _, (bx, by, bw, bh) = text_to_paths("word", fam, wt, 100, "Excentrix")
    size = 100 * target_w / bw
    ds, (bx, by, bw, bh) = text_to_paths("word", fam, wt, round(size, 2), "Excentrix")
    word = {"paths": ds, "dx": lx - bx, "dy": base - (by + bh), "size": size,
            "bbox": (lx, base - bh, rx, base)}

    fam, wt = SUB_FONT
    lx, rx, base, cap = SUB_BOX
    # altura de mayuscula: medir "H" a 100px
    _, (_, _, _, hh) = text_to_paths("cap", fam, wt, 100, "H")
    size = 100 * cap / hh
    _, (bx, by, bw0, bh) = text_to_paths("sub", fam, wt, round(size, 2), "PERFUMERÍA", 0)
    spacing = ((rx - lx) - bw0) / 9.0  # 10 letras -> 9 huecos visibles
    ds, (bx, by, bw, bh) = text_to_paths("sub", fam, wt, round(size, 2), "PERFUMERÍA", round(spacing, 3))
    sub = {"paths": ds, "dx": lx - bx, "dy": base - (by + bh), "size": size,
           "spacing": spacing, "tracking_em": spacing / size, "bbox": (lx, base - bh, lx + bw, base)}
    return word, sub


def paths_group(w, fill, extra=""):
    inner = "".join(f'<path d="{d}"' + (f' transform="{t}"' if t else "") + "/>" for d, t in w["paths"])
    tr = f"{extra} translate({w['dx']:.3f},{w['dy']:.3f})".strip()
    return f'<g fill="{fill}" transform="{tr}">{inner}</g>'


# ================================================================= 3 COMPOSICION
def svg_doc(vb, body, title):
    x, y, w, h = vb
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.2f} {y:.2f} {w:.2f} {h:.2f}" '
            f'width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')


def union_bbox(*bbs):
    return (min(b[0] for b in bbs), min(b[1] for b in bbs), max(b[2] for b in bbs), max(b[3] for b in bbs))


def pad(bb, p):
    return (bb[0] - p, bb[1] - p, bb[2] - bb[0] + 2 * p, bb[3] - bb[1] + 2 * p)


def compose(iso, word, sub):
    out = {}
    for neg in (False, True):
        ink = WHITE if neg else INK
        suf = "-negativo" if neg else ""
        # --- isotipo solo
        out[f"isotipo{suf}.svg"] = svg_doc(pad(iso["bbox"], 2), iso_group(iso, ink, CRIMSON),
                                           "Excentrix Perfumería")
        # --- logo completo (posiciones del original)
        bb = union_bbox(iso["bbox"], word["bbox"], sub["bbox"])
        body = iso_group(iso, ink, CRIMSON) + paths_group(word, ink) + paths_group(sub, CRIMSON)
        out[f"logo-completo{suf}.svg"] = svg_doc(pad(bb, 12), body, "Excentrix Perfumería")
        # --- horizontal: isotipo a la izquierda, bloque de texto a la derecha
        ix0, iy0, ix1, iy1 = iso["bbox"]
        ih = iy1 - iy0
        wx0, wy0 = word["bbox"][0], word["bbox"][1]
        tb = union_bbox(word["bbox"], sub["bbox"])
        th = tb[3] - tb[1]
        k = 0.70 * ih / th                    # bloque de texto = 70% de la altura del isotipo
        gap = 0.10 * ih
        tx = ix1 + gap - tb[0] * k
        ty = iy0 + (ih - th * k) / 2 - tb[1] * k
        extra = f"translate({tx:.3f},{ty:.3f}) scale({k:.5f})"
        body = (iso_group(iso, ink, CRIMSON) + paths_group(word, ink, extra) +
                paths_group(sub, CRIMSON, extra))
        hb = (ix0, iy0, ix1 + gap + (tb[2] - tb[0]) * k, iy1)
        out[f"logo-horizontal{suf}.svg"] = svg_doc(pad(hb, 2), body, "Excentrix Perfumería")
    return out


# ===================================================================== 4 FAVICON
FAVICON = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<title>Excentrix</title>
<style>
.ink{{fill:{INK}}} .red{{fill:{CRIMSON}}}
@media (prefers-color-scheme: dark){{.ink{{fill:{WHITE}}} .red{{fill:#C8323E}}}}
</style>
<rect class="ink" x="19" y="3" width="20" height="10" rx="2"/>
<rect class="ink" x="24" y="12" width="10" height="7"/>
<path class="ink" d="M12 25 19 18h20l7 7v3L22 58h-7a3 3 0 0 1-3-3Z"/>
<path class="red" d="M31 61c-4-5-2.5-10 5-14.5 0 2.5.5 4 2 5.5C38 45 46 40 49 34c2-4 3-8 2-13C58 29 61 40 57 50c-2 6-7 11-14 11Z"/>
</svg>
"""


def build_favicon():
    path = os.path.join(HERE, "favicon.svg")
    open(path, "w").write(FAVICON)
    # versiones raster (sin media query: tinta sobre transparente / papel)
    light = FAVICON.replace("@media", "@media not all and")  # desactiva el bloque oscuro
    lp = os.path.join(WORK, "favicon-light.svg")
    open(lp, "w").write(light)
    for s in (16, 32, 48, 128):
        render(lp, os.path.join(WORK, f"fav-{s}.png"), width=s)
    run(["magick", os.path.join(WORK, "fav-16.png"), os.path.join(WORK, "fav-32.png"),
         os.path.join(WORK, "fav-48.png"), os.path.join(PUB, "favicon.ico")])
    # iconos con fondo papel (apple-touch / PWA)
    for s, name in ((512, "icon-512.png"), (180, "apple-touch-icon.png")):
        inner = int(s * 0.72)
        render(lp, os.path.join(WORK, f"fav-{inner}.png"), width=inner)
        run(["magick", "-size", f"{s}x{s}", f"xc:{PAPER}", os.path.join(WORK, f"fav-{inner}.png"),
             "-gravity", "center", "-composite", os.path.join(PUB, name)])


# ===================================================================== utilidades
def render(svg, png, width=None, height=None, bg=None):
    cmd = ["inkscape", svg, "--export-type=png", "-o", png]
    if width:
        cmd.append(f"--export-width={width}")
    if height:
        cmd.append(f"--export-height={height}")
    if bg:
        cmd += [f"--export-background={bg}", "--export-background-opacity=1"]
    run(cmd)


def build_og():
    src = os.path.join(HERE, "logo-completo-negativo.svg")
    logo = os.path.join(WORK, "og-logo.png")
    render(src, logo, height=440)
    run(["magick", "-size", "1200x630", f"xc:{INK}", logo, "-gravity", "center",
         "-composite", "-strip", os.path.join(PUB, "og-default.png")])


def previews(files):
    for f in files:
        stem = f[:-4]
        p = os.path.join(HERE, f)
        h = 96 if "favicon" in f else (220 if "horizontal" in f else 600)
        render(p, os.path.join(PREV, f"{stem}--papel.png"), height=h, bg=PAPER)
        if f == "favicon.svg":  # Inkscape no evalua prefers-color-scheme: forzar la variante oscura
            dark = os.path.join(WORK, "favicon-dark.svg")
            open(dark, "w").write(FAVICON.replace("@media (prefers-color-scheme: dark)", "@media all"))
            p = dark
        render(p, os.path.join(PREV, f"{stem}--tinta.png"), height=h, bg=INK)
    # tamanos reales del favicon y header de 56px
    for s in (16, 32):
        run(["magick", os.path.join(WORK, f"fav-{s}.png"), "-background", PAPER, "-flatten",
             "-filter", "point", "-resize", "800%", os.path.join(PREV, f"favicon-{s}px-x8.png")])
    render(os.path.join(HERE, "logo-horizontal.svg"), os.path.join(WORK, "hdr.png"), height=44)
    run(["magick", "-size", "640x56", f"xc:{PAPER}", os.path.join(WORK, "hdr.png"), "-gravity",
         "west", "-geometry", "+16+0", "-composite", os.path.join(PREV, "header-56px.png")])
    # comparacion lado a lado con el original
    render(os.path.join(HERE, "logo-completo.svg"), os.path.join(WORK, "cmp-vec.png"), height=600, bg=PAPER)
    run(["magick", SRC, "-crop", "580x590+350+60", "+repage",
         "-resize", "x600", os.path.join(WORK, "cmp-src.png")])
    run(["magick", os.path.join(WORK, "cmp-src.png"), os.path.join(WORK, "cmp-vec.png"),
         "-background", "#cccccc", "-splice", "6x0", "+append", os.path.join(PREV, "comparacion-original-vs-vector.png")])
    x0, y0, x1, y1 = ISO_CROP
    run(["magick", SRC, "-crop", f"{x1-x0}x{y1-y0}+{x0}+{y0}", "+repage", "-resize", "x900",
         os.path.join(WORK, "cmpi-src.png")])
    render(os.path.join(HERE, "isotipo.svg"), os.path.join(WORK, "cmpi-vec.png"), height=900, bg=PAPER)
    run(["magick", os.path.join(WORK, "cmpi-src.png"), os.path.join(WORK, "cmpi-vec.png"),
         "-background", "#cccccc", "-splice", "6x0", "+append", os.path.join(PREV, "comparacion-isotipo.png")])


def main():
    for d in (WORK, PREV, PUB):
        os.makedirs(d, exist_ok=True)
    iso = build_isotype()
    word, sub = build_wordmark()
    files = compose(iso, word, sub)
    for name, svg in files.items():
        open(os.path.join(HERE, name), "w", encoding="utf-8").write(svg)
    build_favicon()
    build_og()
    final = sorted(files) + ["favicon.svg"]
    for f in final:
        shutil.copy2(os.path.join(HERE, f), os.path.join(PUB, f))
    previews(final)
    print(f"Excentrix: font-size {word['size']:.2f}px (Lora 500)")
    print(f"PERFUMERÍA: font-size {sub['size']:.2f}px, letter-spacing {sub['spacing']:.2f}px "
          f"= {sub['tracking_em']:.3f}em (Montserrat 400)")
    for f in final:
        print(f"{f}: {os.path.getsize(os.path.join(HERE, f))/1024:.1f} KB")


if __name__ == "__main__":
    main()
