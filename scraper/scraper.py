import cloudscraper
import random
import time
from config import DELAY_MIN, DELAY_MAX
from parser import parsear_html
from database import guardar_propiedades

FILTROS = [
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
]

def construir_url(filtro, pagina):
    if filtro["paginacion"] == "path":
        return filtro["url"].replace("{page}", str(pagina)), {}
    else:
        return filtro["url"], {"page": pagina}

def scrapear_filtro(filtro):
    operacion = filtro["operacion"]
    inmueble  = filtro["inmueble"]
    portal    = filtro["portal"]

    print(f"\n{'='*55}")
    print(f"  🏠 {operacion.upper()} DE {inmueble.upper()}S — {portal.capitalize()}")
    print(f"{'='*55}")

    pagina_actual    = 1
    total_guardados  = 0
    errores_seguidos = 0
    ids_vistos       = set()
    MAX_ERRORES      = 3

    while True:
        print(f"\n📄 Scrapeando página {pagina_actual}...")

        url, params = construir_url(filtro, pagina_actual)
        scraper     = cloudscraper.create_scraper()

        try:
            response = scraper.get(url, params=params, timeout=15)
            response.raise_for_status()
            html = response.text
        except Exception as e:
            print(f"  ⚠️  Error en página {pagina_actual}: {e}")
            errores_seguidos += 1
            if errores_seguidos >= MAX_ERRORES:
                print(f"  🛑 {MAX_ERRORES} errores seguidos. Pasando al siguiente filtro.")
                break
            time.sleep(10)
            continue

        errores_seguidos = 0
        propiedades = parsear_html(html, pagina_actual, portal=portal)

        if not propiedades:
            print(f"  ✅ Sin más propiedades. Filtro terminado.")
            break

        ids_nuevos = {p['id'] for p in propiedades}
        if ids_nuevos.issubset(ids_vistos):
            print(f"  🔁 Página repetida detectada. Filtro terminado.")
            break

        ids_vistos.update(ids_nuevos)

        for p in propiedades:
            p['operacion'] = operacion
            p['inmueble']  = inmueble
            p['portal']    = portal

        guardar_propiedades(propiedades)
        total_guardados += len(propiedades)
        print(f"  ✅ {len(propiedades)} extraídas | {total_guardados} total")

        pagina_actual += 1
        delay = random.uniform(DELAY_MIN, DELAY_MAX)
        print(f"  ⏳ Esperando {delay:.1f}s...")
        time.sleep(delay)

    print(f"\n  🎉 Filtro terminado — {total_guardados} propiedades guardadas")
    return total_guardados

def correr_scraper():
    total_general = 0

    for i, filtro in enumerate(FILTROS):
        guardados      = scrapear_filtro(filtro)
        total_general += guardados

        if i < len(FILTROS) - 1:
            pausa = random.uniform(15, 30)
            print(f"\n⏳ Pausa de {pausa:.1f}s antes del siguiente filtro...")
            time.sleep(pausa)

    print(f"\n{'='*55}")
    print(f"  🏆 SCRAPING COMPLETO — {total_general} propiedades en total")
    print(f"{'='*55}")

if __name__ == "__main__":
    correr_scraper()