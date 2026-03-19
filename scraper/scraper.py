import cloudscraper
import random
import time
import threading
from config import DELAY_MIN, DELAY_MAX
from parser import parsear_html
from database import guardar_propiedades

FILTROS = [
    # ── Urbania ───────────────────────────────────────────
    {
        "url":        "https://urbania.pe/buscar/alquiler-de-departamentos",
        "operacion":  "alquiler",
        "inmueble":   "departamento",
        "portal":     "urbania",
        "paginacion": "param"
    },
    {
        "url":        "https://urbania.pe/buscar/alquiler-de-casas",
        "operacion":  "alquiler",
        "inmueble":   "casa",
        "portal":     "urbania",
        "paginacion": "param"
    },
    {
        "url":        "https://urbania.pe/buscar/venta-de-departamentos",
        "operacion":  "venta",
        "inmueble":   "departamento",
        "portal":     "urbania",
        "paginacion": "param"
    },
    {
        "url":        "https://urbania.pe/buscar/venta-de-casas",
        "operacion":  "venta",
        "inmueble":   "casa",
        "portal":     "urbania",
        "paginacion": "param"
    },
    # ── Adondevivir ───────────────────────────────────────
    {
        "url":        "https://www.adondevivir.com/departamentos-en-alquiler-pagina-{page}.html",
        "operacion":  "alquiler",
        "inmueble":   "departamento",
        "portal":     "adondevivir",
        "paginacion": "path"
    },
    {
        "url":        "https://www.adondevivir.com/casas-en-alquiler-pagina-{page}.html",
        "operacion":  "alquiler",
        "inmueble":   "casa",
        "portal":     "adondevivir",
        "paginacion": "path"
    },
    {
        "url":        "https://www.adondevivir.com/casas-en-venta-pagina-{page}.html",
        "operacion":  "venta",
        "inmueble":   "casa",
        "portal":     "adondevivir",
        "paginacion": "path"
    },
    {
        "url":        "https://www.adondevivir.com/departamentos-en-venta-pagina-{page}.html",
        "operacion":  "venta",
        "inmueble":   "departamento",
        "portal":     "adondevivir",
        "paginacion": "path"
    },
    # ── Infocasas ─────────────────────────────────────────
    {
        "url":        "https://www.infocasas.com.pe/alquiler/departamentos/pagina{page}",
        "operacion":  "alquiler",
        "inmueble":   "departamento",
        "portal":     "infocasas",
        "paginacion": "path"
    },
    {
        "url":        "https://www.infocasas.com.pe/alquiler/casas/pagina{page}",
        "operacion":  "alquiler",
        "inmueble":   "casa",
        "portal":     "infocasas",
        "paginacion": "path"
    },
    {
        "url":        "https://www.infocasas.com.pe/venta/casas/pagina{page}",
        "operacion":  "venta",
        "inmueble":   "casa",
        "portal":     "infocasas",
        "paginacion": "path"
    },
    {
        "url":        "https://www.infocasas.com.pe/venta/departamentos/pagina{page}",
        "operacion":  "venta",
        "inmueble":   "departamento",
        "portal":     "infocasas",
        "paginacion": "path"
    },
    # ── Babilonia ─────────────────────────────────────────
    {
        "url":        "https://babilonia.pe/inmuebles/departamentos-en-alquiler",
        "operacion":  "alquiler",
        "inmueble":   "departamento",
        "portal":     "babilonia",
        "paginacion": "unica"
    },
    {
        "url":        "https://babilonia.pe/inmuebles/casas-en-alquiler",
        "operacion":  "alquiler",
        "inmueble":   "casa",
        "portal":     "babilonia",
        "paginacion": "unica"
    },
    {
        "url":        "https://babilonia.pe/inmuebles/departamentos-en-venta",
        "operacion":  "venta",
        "inmueble":   "departamento",
        "portal":     "babilonia",
        "paginacion": "unica"
    },
    {
        "url":        "https://babilonia.pe/inmuebles/casas-en-venta",
        "operacion":  "venta",
        "inmueble":   "casa",
        "portal":     "babilonia",
        "paginacion": "unica"
    },
    # ── Properati ─────────────────────────────────────────
    {
        "url":        "https://www.properati.com.pe/s/departamento/alquiler/{page}",
        "operacion":  "alquiler",
        "inmueble":   "departamento",
        "portal":     "properati",
        "paginacion": "path"
    },
    {
        "url":        "https://www.properati.com.pe/s/departamento/venta/{page}",
        "operacion":  "venta",
        "inmueble":   "departamento",
        "portal":     "properati",
        "paginacion": "path"
    },
    {
        "url":        "https://www.properati.com.pe/s/casa/alquiler/{page}",
        "operacion":  "alquiler",
        "inmueble":   "casa",
        "portal":     "properati",
        "paginacion": "path"
    },
    {
        "url":        "https://www.properati.com.pe/s/casa/venta/{page}",
        "operacion":  "venta",
        "inmueble":   "casa",
        "portal":     "properati",
        "paginacion": "path"
    },
]

ICONOS = {
    "urbania":     "🟦",
    "adondevivir": "🟩",
    "infocasas":   "🟥",
    "babilonia":   "🟧",
    "properati":   "🟪"
}

def construir_url(filtro, pagina):
    if filtro["paginacion"] == "unica":
        return filtro["url"], {}
    elif filtro["paginacion"] == "path":
        return filtro["url"].replace("{page}", str(pagina)), {}
    else:
        return filtro["url"], {"page": pagina}

def tag(portal):
    icono = ICONOS.get(portal, "⬜")
    return f"{icono} [{portal.upper()}]"

def scrapear_filtro(filtro):
    operacion = filtro["operacion"]
    inmueble  = filtro["inmueble"]
    portal    = filtro["portal"]
    prefijo   = tag(portal)

    print(f"\n{'='*60}")
    print(f"  {prefijo}  {operacion.upper()} DE {inmueble.upper()}S")
    print(f"{'='*60}")

    pagina_actual    = 1
    total_guardados  = 0
    errores_seguidos = 0
    ids_vistos       = set()
    MAX_ERRORES      = 3

    while True:
        url, params = construir_url(filtro, pagina_actual)
        scraper     = cloudscraper.create_scraper()

        try:
            response = scraper.get(url, params=params, timeout=15)
            response.raise_for_status()
            html = response.text
        except Exception as e:
            errores_seguidos += 1
            print(f"  {prefijo}  ⚠️  Pág {pagina_actual} — Error: {e}")
            if errores_seguidos >= MAX_ERRORES:
                print(f"  {prefijo}  🛑 {MAX_ERRORES} errores seguidos. Pasando al siguiente filtro.")
                break
            time.sleep(10)
            continue

        errores_seguidos = 0
        propiedades = parsear_html(html, pagina_actual, portal=portal)

        if not propiedades:
            print(f"  {prefijo}  ✅ Pág {pagina_actual} — Sin más propiedades. Filtro terminado.")
            break

        ids_nuevos = {p['id'] for p in propiedades}
        if ids_nuevos.issubset(ids_vistos):
            print(f"  {prefijo}  🔁 Pág {pagina_actual} — Página repetida. Filtro terminado.")
            break

        ids_vistos.update(ids_nuevos)

        for p in propiedades:
            p['operacion'] = operacion
            p['inmueble']  = inmueble
            p['portal']    = portal

        guardar_propiedades(propiedades)
        total_guardados += len(propiedades)

        delay = random.uniform(DELAY_MIN, DELAY_MAX)
        print(f"  {prefijo}  📄 Pág {pagina_actual} — {len(propiedades):>2} extraídas | "
              f"Total: {total_guardados:>4} | Próxima en {delay:.1f}s")

        if filtro["paginacion"] == "unica":
            print(f"  {prefijo}  ✅ Página única procesada. Filtro terminado.")
            break

        time.sleep(delay)
        pagina_actual += 1

    print(f"  {prefijo}  🎉 Listo — {total_guardados} propiedades guardadas")
    return total_guardados

def correr_scraper():
    filtros_urbania     = [f for f in FILTROS if f['portal'] == 'urbania']
    filtros_adondevivir = [f for f in FILTROS if f['portal'] == 'adondevivir']
    filtros_infocasas   = [f for f in FILTROS if f['portal'] == 'infocasas']
    filtros_babilonia   = [f for f in FILTROS if f['portal'] == 'babilonia']
    filtros_properati   = [f for f in FILTROS if f['portal'] == 'properati']

    print("\n" + "="*60)
    print("  🚀 INICIANDO SCRAPING")
    print(f"  🟦 Urbania:      {len(filtros_urbania)} filtros")
    print(f"  🟩 Adondevivir:  {len(filtros_adondevivir)} filtros")
    print(f"  🟥 Infocasas:    {len(filtros_infocasas)} filtros")
    print(f"  🟧 Babilonia:    {len(filtros_babilonia)} filtros")
    print(f"  🟪 Properati:    {len(filtros_properati)} filtros")
    print("="*60)

    def scrapear_portal(filtros):
        total = 0
        for i, filtro in enumerate(filtros):
            guardados = scrapear_filtro(filtro)
            total += guardados
            if i < len(filtros) - 1:
                pausa = random.uniform(15, 30)
                print(f"  {tag(filtro['portal'])}  ⏳ Pausa de {pausa:.1f}s antes del siguiente filtro...")
                time.sleep(pausa)
        return total

    hilo_urbania     = threading.Thread(target=scrapear_portal, args=(filtros_urbania,),     name="Urbania")
    hilo_adondevivir = threading.Thread(target=scrapear_portal, args=(filtros_adondevivir,), name="Adondevivir")
    hilo_infocasas   = threading.Thread(target=scrapear_portal, args=(filtros_infocasas,),   name="Infocasas")
    hilo_babilonia   = threading.Thread(target=scrapear_portal, args=(filtros_babilonia,),   name="Babilonia")
    hilo_properati   = threading.Thread(target=scrapear_portal, args=(filtros_properati,),   name="Properati")

    hilo_urbania.start()
    time.sleep(random.uniform(3, 6))
    hilo_adondevivir.start()
    time.sleep(random.uniform(3, 6))
    hilo_infocasas.start()
    time.sleep(random.uniform(3, 6))
    hilo_babilonia.start()
    time.sleep(random.uniform(3, 6))
    hilo_properati.start()

    hilo_urbania.join()
    hilo_adondevivir.join()
    hilo_infocasas.join()
    hilo_babilonia.join()
    hilo_properati.join()

    print("\n" + "="*60)
    print("  🏆 SCRAPING COMPLETO")
    print("="*60)

if __name__ == "__main__":
    correr_scraper()