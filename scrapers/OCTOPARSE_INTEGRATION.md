# Integración con Octoparse

Esta guía explica cómo integrar Octoparse con tu plataforma de búsqueda inmobiliaria como alternativa o complemento a los scrapers Python.

---

## ¿Qué es Octoparse?

Octoparse es una herramienta visual de web scraping que permite crear scrapers sin programar. Es ideal para:
- Portales con medidas anti-scraping complejas
- Sitios que cambian frecuentemente su estructura
- Reducir tiempo de desarrollo
- Mantenimiento más fácil

---

## Planes y Precios

| Plan | Precio | Características |
|------|--------|-----------------|
| **Free** | $0 | Ejecución manual, sin cloud |
| **Standard** | $75/mes | 10 tareas cloud, ejecución programada |
| **Professional** | $189/mes | 20 tareas cloud, más recursos |
| **Enterprise** | $249/mes | Ilimitado, soporte prioritario |

**Recomendación**: Plan Standard es suficiente para 14 portales.

---

## Arquitectura de Integración

```
Octoparse Cloud
    ↓ (scraping cada 12 horas)
    ↓
Exporta a MySQL/CSV/API
    ↓
Tu Base de Datos (properties table)
    ↓
Tu Plataforma muestra datos
```

---

## Paso 1: Configurar Octoparse

### 1.1 Crear Cuenta
1. Ir a https://www.octoparse.com
2. Crear cuenta (puedes empezar con plan Free)
3. Descargar e instalar Octoparse Desktop

### 1.2 Crear Scraper para Urbania (Ejemplo)

1. **Abrir Octoparse Desktop**
2. **Nueva Tarea** → Ingresar URL: `https://urbania.pe/buscar/venta-de-departamentos`
3. **Modo Wizard** (recomendado para principiantes):
   - Hacer clic en una propiedad
   - Seleccionar "Extract data from list"
   - Octoparse detectará automáticamente el patrón
4. **Seleccionar Campos**:
   - Título
   - Precio
   - Dirección/Distrito
   - Dormitorios
   - Baños
   - Área (m²)
   - URL de la propiedad
   - URL de la imagen
5. **Configurar Paginación**:
   - Hacer clic en botón "Siguiente página"
   - Seleccionar "Loop through pages"
   - Establecer límite (ej: 10 páginas)
6. **Guardar Tarea**

### 1.3 Configurar Exportación

**Opción A: Exportar a MySQL (Recomendado)**

1. En Octoparse, ir a **Settings** → **Export**
2. Seleccionar **Database** → **MySQL**
3. Configurar conexión:
   ```
   Host: [Tu servidor MySQL]
   Port: 3306
   Database: [Nombre de tu base de datos]
   Username: [Usuario]
   Password: [Contraseña]
   Table: properties
   ```
4. **Mapear Campos**:
   - Título → title
   - Precio → price
   - Distrito → district
   - etc.

**Opción B: Exportar a CSV**

1. Configurar exportación a CSV
2. Usar script de importación (ver Paso 2)

---

## Paso 2: Script de Importación desde CSV

Si usas exportación CSV, usa este script:

```python
# scrapers/import_from_octoparse.py
import csv
import mysql.connector
from config import DB_CONFIG
import logging

logger = logging.getLogger(__name__)

def import_csv_to_db(csv_file_path, portal_name):
    """
    Import properties from Octoparse CSV export to database
    """
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    imported = 0
    
    with open(csv_file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                # Map CSV columns to database columns
                property_data = {
                    'externalId': f"oct-{portal_name}-{row.get('ID', hash(row.get('URL')))}",
                    'portal': portal_name,
                    'title': row.get('Title', ''),
                    'operationType': 'venta' if 'venta' in row.get('URL', '').lower() else 'alquiler',
                    'propertyType': 'departamento' if 'departamento' in row.get('URL', '').lower() else 'casa',
                    'price': float(row.get('Price', '0').replace(',', '').replace('$', '')),
                    'currency': 'USD',
                    'area': float(row.get('Area', '0')) if row.get('Area') else None,
                    'bedrooms': int(row.get('Bedrooms', '0')) if row.get('Bedrooms') else None,
                    'bathrooms': int(row.get('Bathrooms', '0')) if row.get('Bathrooms') else None,
                    'district': row.get('District'),
                    'sourceUrl': row.get('URL', ''),
                    'imageUrl': row.get('Image', ''),
                }
                
                # Insert or update
                sql = """
                INSERT INTO properties 
                (externalId, portal, title, operationType, propertyType, price, currency, 
                 area, bedrooms, bathrooms, district, sourceUrl, imageUrl, scrapedAt)
                VALUES (%(externalId)s, %(portal)s, %(title)s, %(operationType)s, %(propertyType)s, 
                        %(price)s, %(currency)s, %(area)s, %(bedrooms)s, %(bathrooms)s, 
                        %(district)s, %(sourceUrl)s, %(imageUrl)s, NOW())
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    price = VALUES(price),
                    area = VALUES(area),
                    bedrooms = VALUES(bedrooms),
                    bathrooms = VALUES(bathrooms),
                    district = VALUES(district),
                    imageUrl = VALUES(imageUrl),
                    scrapedAt = NOW()
                """
                
                cursor.execute(sql, property_data)
                imported += 1
                
            except Exception as e:
                logger.error(f"Error importing row: {e}")
                continue
    
    conn.commit()
    cursor.close()
    conn.close()
    
    logger.info(f"Imported {imported} properties from {csv_file_path}")
    return imported

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python import_from_octoparse.py <csv_file> <portal_name>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    portal = sys.argv[2]
    import_csv_to_db(csv_file, portal)
```

**Uso**:
```bash
python scrapers/import_from_octoparse.py /path/to/urbania_export.csv urbania
```

---

## Paso 3: Automatización

### Opción A: Octoparse Cloud (Plan Standard+)

1. En Octoparse Desktop, hacer clic en **Run on Cloud**
2. Configurar **Schedule**:
   - Frecuencia: Cada 12 horas
   - Hora de inicio: 00:00 y 12:00
3. Octoparse ejecutará automáticamente y exportará a MySQL

### Opción B: Cron Job con CSV

Si usas exportación CSV:

```bash
# Agregar a crontab
0 */12 * * * cd /home/ubuntu/real_estate_search_ai/scrapers && python import_from_octoparse.py /path/to/exports/urbania.csv urbania
```

---

## Paso 4: Configurar Múltiples Portales

Repite el proceso para cada portal:

1. **Urbania**: `https://urbania.pe/buscar/venta-de-departamentos`
2. **Adondevivir**: `https://www.adondevivir.com/propiedades/venta/departamentos`
3. **Infocasas**: `https://www.infocasas.com.pe/venta/departamentos`
4. **Properati**: `https://www.properati.com.pe/venta/departamento`
5. **Babilonia**: `https://www.babilonia.pe/venta/departamentos`
6. ... (continuar con los 14 portales)

---

## Ventajas de Octoparse

✅ **Sin programación**: Interfaz visual  
✅ **Manejo anti-scraping**: Rotación de IPs, delays automáticos  
✅ **Mantenimiento fácil**: Re-configurar visualmente si cambia el sitio  
✅ **Cloud execution**: No necesitas tener tu PC encendida  
✅ **Soporte**: Equipo de soporte disponible  

---

## Desventajas

❌ **Costo recurrente**: $75-$249/mes  
❌ **Dependencia externa**: Si Octoparse cae, tu scraping para  
❌ **Menos flexible**: Algunas lógicas complejas son difíciles  

---

## Estrategia Híbrida Recomendada

**Usa Python para**:
- Portales simples (Urbania, Infocasas)
- Portales donde tienes control
- Reducir costos

**Usa Octoparse para**:
- Portales con anti-scraping fuerte (Facebook, TikTok)
- Portales que cambian frecuentemente
- Ahorrar tiempo de desarrollo

**Ejemplo**:
- Python: 8 portales (gratis)
- Octoparse: 6 portales difíciles ($75/mes)
- **Total**: 14 portales, costo optimizado

---

## Soporte

- **Documentación Octoparse**: https://helpcenter.octoparse.com
- **Tutoriales**: https://www.octoparse.com/tutorial
- **Soporte**: support@octoparse.com

---

## Próximos Pasos

1. ✅ Crear cuenta Free en Octoparse
2. ✅ Configurar scraper para 1 portal (Urbania)
3. ✅ Probar exportación a MySQL
4. ✅ Verificar que datos aparezcan en tu plataforma
5. ✅ Decidir si upgrade a plan Standard
6. ✅ Expandir a más portales gradualmente
