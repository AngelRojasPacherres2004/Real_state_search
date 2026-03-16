import cloudscraper
import random
import time
from config import BASE_URL, DELAY_MIN, DELAY_MAX
from parser import parsear_html
from database import guardar_propiedades

def obtener_pagina(url, pagina):
    scraper = cloudscraper.create_scraper()
    params = {"page": pagina}  # siempre manda ?page=N

    try:
        response = scraper.get(url, params=params, timeout=15)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"  ⚠️  Error en página {pagina}: {e}")
        return None

def correr_scraper():
    print("=" * 55)
    print("  🏠 Urbania — Alquiler de Departamentos")
    print("=" * 55)

    pagina_actual   = 1
    total_guardados = 0
    errores_seguidos = 0
    MAX_ERRORES = 3

    while True:
        print(f"\n📄 Scrapeando página {pagina_actual}...")

        html = obtener_pagina(BASE_URL, pagina_actual)

        if html is None:
            errores_seguidos += 1
            if errores_seguidos >= MAX_ERRORES:
                print(f"\n🛑 {MAX_ERRORES} errores seguidos. Deteniendo.")
                break
            print(f"  ↩️  Reintentando página {pagina_actual}...")
            time.sleep(10)
            continue

        errores_seguidos = 0
        propiedades = parsear_html(html, pagina_actual)

        if not propiedades:
            print(f"  ✅ Sin más propiedades. Scraping terminado.")
            break

        guardar_propiedades(propiedades)
        total_guardados += len(propiedades)
        print(f"  ✅ {len(propiedades)} extraídas | {total_guardados} total")

        pagina_actual += 1
        delay = random.uniform(DELAY_MIN, DELAY_MAX)
        print(f"  ⏳ Esperando {delay:.1f}s...")
        time.sleep(delay)

    print("\n" + "=" * 55)
    print(f"  🎉 Finalizado — {total_guardados} propiedades guardadas")
    print("=" * 55)

if __name__ == "__main__":
    correr_scraper()