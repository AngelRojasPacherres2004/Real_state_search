import mysql.connector
from datetime import datetime
from config import DB_CONFIG

def guardar_propiedades(propiedades):
    if not propiedades:
        return 0

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    query = """
        INSERT INTO propiedades 
            (id, precio, mantenimiento, caracteristicas, ubicacion, descripcion, link, foto, pagina_scraping, fecha_scraping)
        VALUES 
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        ON DUPLICATE KEY UPDATE
            precio = VALUES(precio),
            mantenimiento = VALUES(mantenimiento),
            caracteristicas = VALUES(caracteristicas),
            ubicacion = VALUES(ubicacion),
            descripcion = VALUES(descripcion),
            link = VALUES(link),
            foto = VALUES(foto),
            pagina_scraping = VALUES(pagina_scraping),
            fecha_scraping = NOW()
    """

    datos = [
        (
            p['id'],
            p['precio'],
            p['mantenimiento'],
            p['caracteristicas'],
            p['ubicacion'],
            p['descripcion'],
            p['link'],
            p['foto'],
            p['pagina_scraping'],
        )
        for p in propiedades
    ]

    cursor.executemany(query, datos)
    conn.commit()
    guardados = cursor.rowcount
    cursor.close()
    conn.close()
    return guardados