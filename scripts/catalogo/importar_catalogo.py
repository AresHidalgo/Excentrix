#!/usr/bin/env python3
"""Convierte el catálogo PDF de Excentrix en datos limpios para el sitio.

Uso:
    pdftotext -layout "Catálogo Excentrix 2026.pdf" catalogo.txt
    python3 -I scripts/catalogo/importar_catalogo.py catalogo.txt

Genera (y sobrescribe):
    src/modules/catalog/data/catalogo.json  perfumes (inspiración, marca, género)
    src/modules/catalog/data/marcas.json    marcas con su casa (nicho / diseñador / árabe)

Limpieza aplicada:
    - Marcas unificadas (MARCAS_ALIAS).
    - Duplicados: mismo perfume con o sin la marca al inicio del nombre ("Omnia Coral" y
      "Bvlgari Omnia Coral"). Las variantes de concentración ("1 Million" y "1 Million Parfum")
      se mantienen separadas.
    - Mismo perfume en dos géneros: si uno es unisex, queda unisex.
    - Correcciones puntuales en CORRECCIONES.
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from collections import OrderedDict
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DESTINO = RAIZ / "src" / "modules" / "catalog" / "data"

GENEROS = {"FEMENINO": "mujer", "MASCULINO": "hombre", "UNISEX": "unisex"}

MARCAS_ALIAS = {
    "Lacoste Fragrances": "Lacoste",
    "Lacoste Fragances": "Lacoste",
    "Dolce&Gabbana;": "Dolce & Gabbana",
    "Viktor&Rolf;": "Viktor & Rolf",
    "Lataffa": "Lattafa",
    "Lattafa Perfumes": "Lattafa",
    "Parfums De Marly": "Parfums de Marly",
    "Zohair Murad": "Zuhair Murad",
}

# Casa por marca. Todo lo que no aparece aquí es "disenador".
# Las marcas en DUDOSAS están asignadas con el criterio más común en catálogos de
# perfumes inspirados y deben confirmarse con el negocio.
CASA_POR_MARCA = {
    # Árabes / orientales
    "Lattafa": "arabe",
    "Al Haramain": "arabe",
    "Orientica": "arabe",
    "Ahli": "arabe",
    "Armaf": "arabe",
    "Ajmal": "arabe",
    "Zuhair Murad": "arabe",
    "Bharara": "arabe",
    # Nicho
    "Parfums de Marly": "nicho",
    "Creed": "nicho",
    "Montale": "nicho",
    "Mancera": "nicho",
    "Initio": "nicho",
    "Le Labo": "nicho",
    "Tiziana Terenzi": "nicho",
    "Bond No 9": "nicho",
    "Maison Francis Kurkdjian": "nicho",
    "Xerjoff": "nicho",
    "Memo Paris": "nicho",
    "Nishane": "nicho",
    "Byredo": "nicho",
    "Kayali": "nicho",
    "Giardini Di Toscana": "nicho",
    "Zarkoperfume": "nicho",
    "Louis Vuitton": "nicho",
    "Tom Ford": "nicho",
    "ILMIN": "nicho",
}
DUDOSAS = ["Tom Ford", "Louis Vuitton", "Bharara", "ILMIN", "Zuhair Murad", "Kayali", "Zara", "Yanbal"]

# (nombre en el PDF, marca normalizada, género del PDF) -> None para eliminar la fila
CORRECCIONES: dict[tuple[str, str, str], None] = {
    ("Mugler A*Men", "Mugler", "FEMENINO"): None,  # A*Men es masculino; ya está en esa lista
}

PATRON_FILA = re.compile(r"^\s*(.+?)\s{2,}(.+?)\s{2,}(FEMENINO|MASCULINO|UNISEX)\s*$")


def sin_tildes(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )


def slugify(texto: str) -> str:
    texto = sin_tildes(texto.lower()).replace("&", " y ").replace("*", "")
    return re.sub(r"[^a-z0-9]+", "-", texto).strip("-")


def limpiar_nombre(nombre: str) -> str:
    nombre = nombre.replace("’", "'").replace("‘", "'")
    return re.sub(r"\s+", " ", nombre).strip()


def prefijos_de(marca: str) -> list[str]:
    """Formas en que la marca aparece al inicio de un nombre (incluidas las mal escritas)."""
    formas = {marca} | {alias for alias, real in MARCAS_ALIAS.items() if real == marca}
    return sorted(formas, key=len, reverse=True)


def sin_marca(nombre: str, marca: str) -> str:
    """Quita la marca del inicio del nombre: "Bvlgari Omnia Coral" -> "Omnia Coral"."""
    base = sin_tildes(nombre.lower())
    for prefijo in prefijos_de(marca):
        p = sin_tildes(prefijo.lower())
        if base.startswith(p + " ") and len(base) > len(p) + 1:
            return nombre[len(prefijo) + 1 :].strip()
    return nombre


def clave(nombre: str, marca: str) -> str:
    """Clave de duplicado: nombre sin la marca al inicio y sin signos."""
    n = sin_tildes(sin_marca(nombre, marca).lower())
    return re.sub(r"[^a-z0-9]+", " ", n).strip()


def leer_filas(ruta: Path) -> list[dict]:
    filas = []
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        m = PATRON_FILA.match(linea)
        if not m:
            continue
        nombre, marca, genero = (x.strip() for x in m.groups())
        if nombre.startswith("Nombre de la") or "MASCULINOS" in marca:
            continue
        marca = MARCAS_ALIAS.get(marca, marca)
        nombre = limpiar_nombre(nombre)
        if (nombre, marca, genero) in CORRECCIONES:
            continue
        filas.append({"nombre": nombre, "marca": marca, "genero": genero})
    return filas


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("Uso: importar_catalogo.py catalogo.txt (salida de pdftotext -layout)")
    filas = leer_filas(Path(sys.argv[1]))

    # Agrupa por (clave, marca); el género se resuelve después.
    grupos: "OrderedDict[tuple[str, str], dict]" = OrderedDict()
    for fila in filas:
        k = (clave(fila["nombre"], fila["marca"]), fila["marca"])
        g = grupos.setdefault(k, {"nombres": [], "generos": []})
        g["nombres"].append(fila["nombre"])
        if fila["genero"] not in g["generos"]:
            g["generos"].append(fila["genero"])

    perfumes = []
    for (k, marca), g in grupos.items():
        # Nombre a mostrar: sin la marca delante (la marca se muestra aparte).
        nombre = sin_marca(min(g["nombres"], key=len), marca)
        generos = g["generos"]
        if "UNISEX" in generos:
            generos = ["UNISEX"]
        for genero in generos:  # p. ej. 360° de Perry Ellis existe para mujer y para hombre
            perfumes.append({"nombre": nombre, "marca": marca, "genero": GENEROS[genero]})

    perfumes.sort(key=lambda p: (sin_tildes(p["nombre"].lower()), p["marca"], p["genero"]))

    vistos: set[str] = set()
    salida = []
    for p in perfumes:
        base = slugify(f"{p['nombre']} {p['marca']}")
        slug = base if base not in vistos else f"{base}-{p['genero']}"
        vistos.add(slug)
        salida.append(
            {
                "id": slug,
                "slug": slug,
                "inspiradoEn": p["nombre"],
                "marcaId": slugify(p["marca"]),
                "genero": p["genero"],
            }
        )

    marcas = sorted({p["marca"] for p in perfumes}, key=lambda m: sin_tildes(m.lower()))
    salida_marcas = [
        {
            "id": slugify(m),
            "nombre": m,
            "slug": slugify(m),
            "casa": CASA_POR_MARCA.get(m, "disenador"),
            "casaPorConfirmar": m in DUDOSAS,
        }
        for m in marcas
    ]

    DESTINO.mkdir(parents=True, exist_ok=True)
    (DESTINO / "catalogo.json").write_text(
        json.dumps(salida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (DESTINO / "marcas.json").write_text(
        json.dumps(salida_marcas, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    por_genero: dict[str, int] = {}
    por_casa: dict[str, int] = {}
    casa_de = {m["id"]: m["casa"] for m in salida_marcas}
    for p in salida:
        por_genero[p["genero"]] = por_genero.get(p["genero"], 0) + 1
        por_casa[casa_de[p["marcaId"]]] = por_casa.get(casa_de[p["marcaId"]], 0) + 1
    print(f"filas leídas: {len(filas)}")
    print(f"perfumes: {len(salida)}  por género: {por_genero}  por casa: {por_casa}")
    print(f"marcas: {len(salida_marcas)}")


if __name__ == "__main__":
    main()
