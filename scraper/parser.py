import re

def limpiar(texto):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', texto)).strip() if texto else ''

def parsear_navent(html, current_page, portal):
    """Parser para Urbania y Adondevivir (grupo Navent)."""
    resultados = []
    base_url   = 'https://www.adondevivir.com' if portal == 'adondevivir' else 'https://urbania.pe'

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

        precio = re.sub(
            r'(Departamentos desde|Casas desde|Desde|desde)\s*', '',
            limpiar(precio_match.group(1)), flags=re.IGNORECASE
        ).strip() if precio_match else ''

        foto = ''
        if foto_match:
            foto = foto_match.group(1).split('?')[0].replace('360x266', '720x532')

        resultados.append({
            'id':              id_match.group(1),
            'precio':          precio,
            'mantenimiento':   limpiar(expensas_match.group(1))  if expensas_match  else '',
            'caracteristicas': limpiar(features_match.group(1))  if features_match  else '',
            'ubicacion':       limpiar(ubicacion_match.group(1)) if ubicacion_match else '',
            'descripcion':     limpiar(desc_match.group(1))      if desc_match      else '',
            'link':            base_url + link_match.group(1).split('?')[0] if link_match else '',
            'foto':            foto,
            'pagina_scraping': current_page
        })

    return resultados

def parsear_infocasas(html, current_page):
    """Parser para Infocasas."""
    resultados = []
    base_url   = 'https://www.infocasas.com.pe'

    card_blocks = re.split(r'(?=<div[^>]*class="[^"]*listingBoxCard[^"]*")', html)
    card_blocks = [b for b in card_blocks if 'listingBoxCard' in b]

    for card in card_blocks:
        id_match        = re.search(r'href="/[^"]+/(\d+)"', card)
        link_match      = re.search(r'href="(/[^"]+/\d+)"', card)
        precio_match    = re.search(r'class="main-price"[^>]*>([\s\S]*?)</p>', card)
        expensas_match  = re.search(r'class="[^"]*commonExpenses[^"]*"[^>]*>([\s\S]*?)</span>', card)
        ubicacion_match = re.search(r'class="lc-location[^"]*"[^>]*>([\s\S]*?)</strong>', card)
        foto_match      = re.search(r'<img[^>]*src="(https://cdn[^"]+)"[^>]*alt="Image"', card)
        desc_match      = re.search(r'class="lc-description"[^>]*>([\s\S]*?)</p>', card)

        tag_block       = re.search(r'class="lc-typologyTag"[^>]*>([\s\S]*?)</div>', card)
        caracteristicas = ''
        if tag_block:
            strongs = re.findall(r'<strong>([\s\S]*?)</strong>', tag_block.group(0))
            caracteristicas = ' · '.join([limpiar(s) for s in strongs if limpiar(s)])

        if not id_match:
            continue

        resultados.append({
            'id':              id_match.group(1),
            'precio':          limpiar(precio_match.group(1))    if precio_match    else '',
            'mantenimiento':   limpiar(expensas_match.group(1))  if expensas_match  else '',
            'caracteristicas': caracteristicas,
            'ubicacion':       limpiar(ubicacion_match.group(1)) if ubicacion_match else '',
            'descripcion':     limpiar(desc_match.group(1))      if desc_match      else '',
            'link':            base_url + link_match.group(1)    if link_match      else '',
            'foto':            foto_match.group(1)               if foto_match      else '',
            'pagina_scraping': current_page
        })

    return resultados

def parsear_babilonia(html, current_page):
    """Parser para Babilonia."""
    resultados = []
    base_url   = 'https://babilonia.pe'

    card_blocks = re.split(r'(?=<div[^>]*data-id="\d+")', html)
    card_blocks = [b for b in card_blocks if 'data-id=' in b]

    for card in card_blocks:
        id_match        = re.search(r'data-uuid="(\d+)"', card)
        link_match      = re.search(r'href="(/inmueble/[^"]+)"', card)
        precio_match    = re.search(r'class="section-price"[^>]*>([\s\S]*?)</div>', card)
        features_match  = re.search(r'class="caracteristicas"[^>]*>([\s\S]*?)</h3>', card)
        ubicacion_match = re.search(r'class="[^"]*section-title-address[^"]*"[^>]*>([\s\S]*?)</h2>', card)
        foto_match      = re.search(r'class="carousel-cell[^"]*"[\s\S]*?src="(https://babilonia\.pe/compress/[^"]+)"', card)

        if not precio_match and not ubicacion_match:
            continue

        resultados.append({
            'id':              id_match.group(1)                            if id_match        else '',
            'precio':          limpiar(precio_match.group(1))               if precio_match    else '',
            'mantenimiento':   '',
            'caracteristicas': limpiar(features_match.group(1))             if features_match  else '',
            'ubicacion':       limpiar(ubicacion_match.group(1))            if ubicacion_match else '',
            'descripcion':     '',
            'link':            base_url + link_match.group(1).split('?')[0] if link_match      else '',
            'foto':            foto_match.group(1).split('?')[0]            if foto_match      else '',
            'pagina_scraping': current_page
        })

    return resultados

def parsear_properati(html, current_page):
    """Parser para Properati."""
    resultados = []

    card_blocks = re.split(r'(?=<article)', html)
    card_blocks = [b for b in card_blocks if 'snippet__title' in b]

    for card in card_blocks:
        id_match        = re.search(r'data-idanuncio="([^"]+)"', card)
        link_match      = re.search(r'href="(https://www\.properati\.com\.pe/[^"]+)"\s+class="title"', card)
        precio_match    = re.search(r'class="price"[^>]*data-test="snippet__price"[^>]*>([\s\S]*?)</div>', card)
        ubicacion_match = re.search(r'class="location"[^>]*data-test="snippet__location"[^>]*>([\s\S]*?)</div>', card)
        features_match  = re.search(r'class="properties"[^>]*>([\s\S]*?)</div>', card)
        foto_match      = re.search(r'class="swiper-no-swiping"\s+src="([^"]+)"', card)

        if not link_match and not precio_match:
            continue

        resultados.append({
            'id':              id_match.group(1)                         if id_match        else '',
            'precio':          limpiar(precio_match.group(1))            if precio_match    else '',
            'mantenimiento':   '',
            'caracteristicas': limpiar(features_match.group(1))          if features_match  else '',
            'ubicacion':       limpiar(ubicacion_match.group(1))         if ubicacion_match else '',
            'descripcion':     '',
            'link':            link_match.group(1).split('?')[0]         if link_match      else '',
            'foto':            foto_match.group(1).split('?')[0]         if foto_match      else '',
            'pagina_scraping': current_page
        })

    return resultados

def parsear_html(html, current_page, portal='urbania'):
    """Función principal — enruta al parser correcto según portal."""
    if portal == 'infocasas':
        return parsear_infocasas(html, current_page)
    elif portal == 'babilonia':
        return parsear_babilonia(html, current_page)
    elif portal == 'properati':
        return parsear_properati(html, current_page)
    else:
        return parsear_navent(html, current_page, portal)