import mysql.connector
from datetime import datetime
from config import DB_CONFIG

def guardar_propiedades(propiedades):
    if not propiedades:
        return 0

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    query = """
        INSERT INTO departamentos 
            (portal, id_listing, precio, mantenimiento, caracteristicas, 
             ubicacion, link, foto, operacion, inmueble, ultima_vez_visto)
        VALUES 
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            precio           = VALUES(precio),
            mantenimiento    = VALUES(mantenimiento),
            caracteristicas  = VALUES(caracteristicas),
            ubicacion        = VALUES(ubicacion),
            link             = VALUES(link),
            foto             = VALUES(foto),
            operacion        = VALUES(operacion),
            inmueble         = VALUES(inmueble),
            portal           = VALUES(portal),
            ultima_vez_visto = CURRENT_TIMESTAMP
    """

    ahora = datetime.now()

    datos = [
        (
            p.get('portal',    'desconocido'),   # ← dinámico
            p['id'],
            p['precio'],
            p['mantenimiento'],
            p['caracteristicas'],
            p['ubicacion'],
            p['link'],
            p['foto'],
            p.get('operacion', 'desconocido'),   # ← dinámico
            p.get('inmueble',  'desconocido'),   # ← dinámico
            ahora
        )
        for p in propiedades
    ]

    cursor.executemany(query, datos)
    conn.commit()
    guardados = cursor.rowcount
    cursor.close()
    conn.close()
    return guardados