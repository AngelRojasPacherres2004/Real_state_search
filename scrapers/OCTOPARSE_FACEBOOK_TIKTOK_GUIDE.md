# Guía de Configuración: Octoparse para Facebook Marketplace y TikTok

Esta guía te ayudará a configurar scrapers visuales en Octoparse para extraer propiedades inmobiliarias de Facebook Marketplace y TikTok, dos plataformas con fuertes protecciones anti-scraping que son difíciles de automatizar con Python.

## ¿Por qué Octoparse para Facebook y TikTok?

**Facebook Marketplace** y **TikTok** tienen:
- Autenticación obligatoria (login requerido)
- Protecciones anti-bot avanzadas (CAPTCHA, rate limiting)
- Contenido dinámico cargado con JavaScript
- Estructura HTML que cambia frecuentemente

**Octoparse** es una herramienta visual de web scraping que:
- Simula comportamiento humano real
- Maneja login y CAPTCHA automáticamente
- Tiene plantillas pre-configuradas para redes sociales
- Exporta datos a CSV/Excel/API
- Ofrece scraping en la nube (no requiere tu computadora encendida)

---

## Paso 1: Crear Cuenta en Octoparse

1. Ve a [https://www.octoparse.com/](https://www.octoparse.com/)
2. Crea una cuenta gratuita (plan Free incluye 10,000 registros/mes)
3. Descarga e instala Octoparse Desktop (Windows/Mac)
4. Inicia sesión en la aplicación

**Planes recomendados:**
- **Free**: 10,000 registros/mes - Suficiente para pruebas
- **Standard ($75/mes)**: 100,000 registros/mes - Recomendado para producción
- **Professional ($209/mes)**: Ilimitado + Cloud scraping + API

---

## Paso 2: Configurar Scraper de Facebook Marketplace

### 2.1 Crear Nuevo Proyecto

1. Abre Octoparse Desktop
2. Click en **"New Task"** → **"Custom Task"**
3. Ingresa la URL de búsqueda de Facebook Marketplace:
   ```
   https://www.facebook.com/marketplace/lima/propertyrentals
   ```
   O para venta:
   ```
   https://www.facebook.com/marketplace/lima/search?query=departamento%20venta
   ```

### 2.2 Configurar Login de Facebook

1. En la página de login, click en **"Login Detection"**
2. Ingresa tus credenciales de Facebook
3. Octoparse guardará la sesión para futuros scrapes
4. **Importante**: Usa una cuenta secundaria, no tu cuenta personal

### 2.3 Seleccionar Datos a Extraer

En el modo visual de Octoparse, selecciona los siguientes campos:

**Campos obligatorios:**
- **Título**: Click en el título de la propiedad → "Extract text"
- **Precio**: Click en el precio → "Extract text"
- **Ubicación**: Click en la ubicación → "Extract text"
- **Imagen**: Click derecho en imagen → "Extract image URL"
- **URL**: Click derecho en tarjeta → "Extract URL"

**Campos opcionales:**
- **Descripción**: Si está visible en la lista
- **Fecha de publicación**: "Publicado hace X días"
- **Vendedor**: Nombre del publicante

### 2.4 Configurar Paginación

1. Scroll hasta el final de la página
2. Click en el botón **"Ver más"** o **"Load more"**
3. Octoparse detectará automáticamente la paginación
4. Configura: **"Loop clicking until no more data"**

### 2.5 Configurar Filtros de Búsqueda

Para buscar en distritos específicos:
1. Usa la barra de búsqueda de Facebook: `"departamento Jesús María"`
2. Aplica filtros de precio en Facebook antes de iniciar scraping
3. Guarda la URL con filtros aplicados

### 2.6 Ejecutar y Exportar

1. Click en **"Run"** → **"Run on Cloud"** (recomendado)
2. Configura frecuencia: **Cada 12 horas**
3. Formato de exportación: **CSV**
4. Descarga el CSV cuando termine

---

## Paso 3: Configurar Scraper de TikTok

### 3.1 Crear Nuevo Proyecto

1. En Octoparse, click **"New Task"** → **"Custom Task"**
2. Ingresa URL de búsqueda de TikTok:
   ```
   https://www.tiktok.com/search?q=departamento%20venta%20lima
   ```
   O busca hashtags:
   ```
   https://www.tiktok.com/tag/departamentoslima
   ```

### 3.2 Configurar Login de TikTok (Opcional)

TikTok permite ver contenido sin login, pero con login obtienes más resultados:
1. Click en **"Login Detection"**
2. Ingresa credenciales de TikTok
3. Usa cuenta secundaria

### 3.3 Seleccionar Datos a Extraer

**Campos a extraer de videos de TikTok:**
- **Descripción del video**: Contiene información de la propiedad
- **Usuario**: Nombre del agente inmobiliario
- **URL del video**: Para referencia
- **Thumbnail**: Imagen de portada del video
- **Likes/Views**: Indicador de popularidad
- **Hashtags**: Para categorización

**Extracción de datos del caption:**
Los datos de propiedades están en la descripción del video. Necesitarás procesarlos después:
- Precio (buscar: "$", "USD", "S/", "soles")
- Ubicación (buscar: nombres de distritos)
- Características (buscar: "dormitorios", "baños", "m²")

### 3.4 Configurar Scroll Infinito

1. Octoparse detectará automáticamente el scroll infinito de TikTok
2. Configura: **"Scroll and load more"**
3. Límite: **50-100 videos** por ejecución (para evitar bloqueos)

### 3.5 Ejecutar y Exportar

1. Click en **"Run"** → **"Run on Cloud"**
2. Frecuencia: **Cada 24 horas** (TikTok es más estricto)
3. Formato: **CSV**

---

## Paso 4: Importar Datos a tu Base de Datos

### 4.1 Descargar CSV de Octoparse

1. Ve a **"Cloud Tasks"** en Octoparse
2. Click en tu tarea completada
3. Click **"Export"** → **"Download CSV"**
4. Guarda el archivo en tu computadora

### 4.2 Usar el Script de Importación

Ya tienes un script listo para importar CSV de Octoparse:

```bash
cd /home/ubuntu/real_estate_search_ai
python3 scrapers/import_from_octoparse.py facebook_marketplace.csv facebook
python3 scrapers/import_from_octoparse.py tiktok_properties.csv tiktok
```

### 4.3 Formato Esperado del CSV

El CSV debe tener estas columnas (puedes mapearlas en Octoparse):

```csv
title,price,currency,area,bedrooms,bathrooms,district,address,description,image_url,source_url,property_type,operation_type
Departamento en Jesús María,120000,USD,80,2,2,Jesús María,,Hermoso depto...,https://...,https://...,apartment,sale
```

**Mapeo de columnas de Facebook/TikTok:**
- `title` → Título del post/video
- `price` → Extraer de descripción (regex)
- `district` → Extraer de ubicación o descripción
- `description` → Caption completo
- `image_url` → Thumbnail o primera imagen
- `source_url` → URL del post/video

---

## Paso 5: Automatización con Octoparse API

Para automatización completa sin descargar CSV manualmente:

### 5.1 Obtener API Key

1. En Octoparse, ve a **"Settings"** → **"API"**
2. Copia tu **API Key**
3. Guárdala en un lugar seguro

### 5.2 Crear Script de Importación Automática

```python
# scrapers/octoparse_auto_import.py
import requests
import csv
import io
from base_scraper import BaseScraper

class OctoparseImporter:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://dataapi.octoparse.com"
    
    def get_task_data(self, task_id: str):
        """Obtener datos de una tarea de Octoparse"""
        url = f"{self.base_url}/data/export"
        params = {
            "taskId": task_id,
            "format": "csv"
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        
        response = requests.get(url, params=params, headers=headers)
        return response.text
    
    def import_to_db(self, csv_data: str, portal: str):
        """Importar datos CSV a la base de datos"""
        # Usar el script existente import_from_octoparse.py
        pass

# Uso:
# importer = OctoparseImporter(api_key="tu_api_key")
# data = importer.get_task_data(task_id="facebook_marketplace_task_id")
# importer.import_to_db(data, "facebook")
```

---

## Paso 6: Configurar Cron Job para Importación Automática

Agrega al crontab para ejecutar cada 12 horas:

```bash
# Importar datos de Octoparse cada 12 horas
0 */12 * * * cd /home/ubuntu/real_estate_search_ai && python3 scrapers/octoparse_auto_import.py facebook >> /home/ubuntu/real_estate_search_ai/logs/octoparse_facebook.log 2>&1
0 */12 * * * cd /home/ubuntu/real_estate_search_ai && python3 scrapers/octoparse_auto_import.py tiktok >> /home/ubuntu/real_estate_search_ai/logs/octoparse_tiktok.log 2>&1
```

---

## Mejores Prácticas

### Para Facebook Marketplace:

1. **Usa filtros de ubicación**: Busca por distrito específico
2. **Filtra por precio**: Establece rango antes de scraping
3. **Evita scraping masivo**: Máximo 100 propiedades por ejecución
4. **Usa cuenta secundaria**: No tu cuenta personal
5. **Frecuencia moderada**: Cada 12-24 horas

### Para TikTok:

1. **Busca por hashtags**: `#departamentoslima`, `#bienesraicesperu`
2. **Sigue agentes inmobiliarios**: Scrape sus perfiles
3. **Extrae datos del caption**: Usa regex para parsear
4. **Límite de videos**: 50-100 por ejecución
5. **Frecuencia baja**: Cada 24 horas

### Procesamiento de Datos:

1. **Limpieza de texto**: Los datos de redes sociales son sucios
2. **Extracción con regex**: Precio, ubicación, características
3. **Validación**: Descarta posts sin precio o ubicación
4. **Deduplicación**: Usa URL como identificador único

---

## Costos Estimados

### Octoparse:
- **Free**: $0/mes - 10,000 registros
- **Standard**: $75/mes - 100,000 registros
- **Professional**: $209/mes - Ilimitado

### Recomendación:
- **Fase de prueba**: Plan Free (suficiente para 2-3 meses)
- **Producción**: Plan Standard ($75/mes)
- **Escala completa**: Plan Professional si necesitas >100k propiedades/mes

---

## Alternativas a Octoparse

Si Octoparse no funciona para ti:

1. **Apify** ([apify.com](https://apify.com))
   - Scrapers pre-hechos para Facebook, TikTok
   - Pago por uso: $49/mes + $0.25/1000 páginas
   
2. **Bright Data** ([brightdata.com](https://brightdata.com))
   - Red de proxies residenciales
   - Evita bloqueos de IP
   - Más caro: $500/mes mínimo

3. **Manual con Extensión de Chrome**
   - Usa "Data Miner" o "Web Scraper"
   - Gratis pero requiere trabajo manual
   - Bueno para volúmenes pequeños

---

## Soporte y Troubleshooting

### Problema: Octoparse no puede hacer login
**Solución**: 
- Verifica credenciales
- Desactiva 2FA en la cuenta secundaria
- Usa modo "Manual Login" y completa CAPTCHA manualmente

### Problema: Facebook bloquea el scraping
**Solución**:
- Reduce frecuencia de scraping
- Usa proxies residenciales
- Cambia de cuenta

### Problema: TikTok no muestra resultados
**Solución**:
- Usa hashtags en lugar de búsqueda por texto
- Scrape perfiles de agentes directamente
- Reduce número de videos por ejecución

### Problema: Datos incompletos en CSV
**Solución**:
- Revisa selectores en Octoparse
- Agrega "Wait" antes de extraer datos
- Usa "Extract all text" en lugar de selectores específicos

---

## Próximos Pasos

1. ✅ Crea cuenta en Octoparse
2. ✅ Configura scraper de Facebook Marketplace
3. ✅ Configura scraper de TikTok
4. ✅ Ejecuta primera prueba y descarga CSV
5. ✅ Importa datos con `import_from_octoparse.py`
6. ✅ Verifica datos en tu aplicación web
7. ✅ Configura automatización con API (opcional)
8. ✅ Programa cron jobs para importación automática

---

## Contacto y Recursos

- **Octoparse Tutorials**: [https://www.octoparse.com/tutorial](https://www.octoparse.com/tutorial)
- **Octoparse API Docs**: [https://helpcenter.octoparse.com/hc/en-us/articles/360018736591](https://helpcenter.octoparse.com/hc/en-us/articles/360018736591)
- **Facebook Marketplace Scraping Guide**: [https://www.octoparse.com/blog/scrape-facebook-marketplace](https://www.octoparse.com/blog/scrape-facebook-marketplace)
- **TikTok Scraping Best Practices**: [https://www.octoparse.com/blog/how-to-scrape-tiktok](https://www.octoparse.com/blog/how-to-scrape-tiktok)

---

**¡Buena suerte con tu scraping! 🚀**
