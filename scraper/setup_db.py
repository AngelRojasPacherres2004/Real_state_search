import mysql.connector
from config import DB_CONFIG

def crear_base_de_datos():
    """Crea la base de datos y la tabla si no existen."""

    # Primero conectar sin especificar BD para crearla
    conn = mysql.connector.connect(
        host=DB_CONFIG["host"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"]
    )
    cursor = conn.cursor()

    # Crear base de datos
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    print(f"✅ Base de datos '{DB_CONFIG['database']}' lista.")

    cursor.execute(f"USE {DB_CONFIG['database']}")

    # Crear tabla de propiedades
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS propiedades (
            id VARCHAR(50) PRIMARY KEY,
            precio VARCHAR(100),
            mantenimiento VARCHAR(100),
            caracteristicas TEXT,
            ubicacion VARCHAR(255),
            descripcion TEXT,
            link VARCHAR(500),
            foto VARCHAR(500),
            pagina_scraping INT,
            fecha_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    """)
    print("✅ Tabla 'propiedades' lista.")

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Base de datos configurada correctamente.\n")

if __name__ == "__main__":
    crear_base_de_datos()