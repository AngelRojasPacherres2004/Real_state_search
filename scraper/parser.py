import re

def parsear_html(html, current_page, portal='urbania'):
    """
    Extrae propiedades del HTML de Urbania o Adondevivir.
    Ambas usan los mismos data-qa al ser del grupo Navent.
    """
    resultados = []

    # Dominio base según portal
    if portal == 'adondevivir':
        base_url = 'https://www.adondevivir.com'
    else:
        base_url = 'https://urbania.pe'

    # Dividir HTML en bloques por propiedad
    card_blocks = re.split(r'(?=<div[^>]*data-id="\d+")', html)
    card_blocks = [b for b in card_blocks if 'data-id=' in b]

    for card in card_blocks:
        id_match        = re.search(r'data-id="(\d+)"', card)
        link_match      = re.search(r'data-to-posting="([^"]+)"', card)
        precio_match    = re.search(r'data-qa="POSTING_CARD_PRICE"[^>]*>([\s\S]*?)</(?:h2|div)>', card)
        expensas_match  = re.search(r'data-qa="expensas"[^>]*>([\s\S]*?)</(h2|div)>', card)
        features_match  = re.search(r'data-qa="POSTING_CARD_FEATURES"[^>]*>([\s\S]*?)</h3>', card)
        ubicacion_match = re.search(r'data-qa="POSTING_CARD_LOCATION"[^>]*>([\s\S]*?)</h(?:2|4)>', card)
        foto_match      = re.search(r'data-qa="POSTING_CARD_GALLERY"[\s\S]*?<img[^>]*src="([^"]+)"', card)
        desc_match      = re.search(r'data-qa="POSTING_CARD_DESCRIPTION"[^>]*>([\s\S]*?)</(?:p|a)>', card)

        if not id_match:
            continue

        def limpiar(texto):
            return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', texto)).strip() if texto else ''

        precio = re.sub(r'(Departamentos desde|Casas desde|Desde|desde)\s*', '', limpiar(precio_match.group(1)), flags=re.IGNORECASE).strip() if precio_match else ''
        mantenimiento   = limpiar(expensas_match.group(1))  if expensas_match  else ''
        caracteristicas = limpiar(features_match.group(1))  if features_match  else ''
        ubicacion       = limpiar(ubicacion_match.group(1)) if ubicacion_match else ''
        descripcion     = limpiar(desc_match.group(1))      if desc_match      else ''
        link            = base_url + link_match.group(1).split('?')[0] if link_match else ''

        foto = ''
        if foto_match:
            foto = foto_match.group(1).split('?')[0].replace('360x266', '720x532')

        resultados.append({
            'id':              id_match.group(1),
            'precio':          precio,
            'mantenimiento':   mantenimiento,
            'caracteristicas': caracteristicas,
            'ubicacion':       ubicacion,
            'descripcion':     descripcion,
            'link':            link,
            'foto':            foto,
            'pagina_scraping': current_page
        })

    return resultados