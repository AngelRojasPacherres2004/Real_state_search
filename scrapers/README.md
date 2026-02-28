# Guía de Scrapers - Sistema de Búsqueda Inmobiliaria

Esta guía te ayudará a agregar nuevos scrapers para los 13 portales restantes.

## 📋 Estructura del Proyecto

```
scrapers/
├── __init__.py           # Paquete Python
├── config.py             # Configuración (DB, timeouts, etc.)
├── base_scraper.py       # Clase base con funcionalidad común
├── urbania.py            # ✅ Scraper de Urbania (IMPLEMENTADO)
├── adondevivir.py        # ⏳ Pendiente
├── infocasas.py          # ⏳ Pendiente
├── ... (11 más)          # ⏳ Pendientes
├── run_scrapers.py       # Script maestro para ejecutar todos
├── setup_cron.sh         # Configuración de cron jobs
├── requirements.txt      # Dependencias Python
└── README.md             # Esta guía
```

---

## 🚀 Cómo Agregar un Nuevo Scraper

### Paso 1: Crear el Archivo del Scraper

Crea un nuevo archivo `nombre_portal.py` (por ejemplo, `adondevivir.py`):

```python
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from base_scraper import BaseScraper

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class AdondevivirScraper(BaseScraper):
    """Scraper for Adondevivir.com"""
    
    def __init__(self):
        super().__init__('adondevivir')
        self.base_url = 'https://www.adondevivir.com'
    
    def scrape(self):
        """Main scraping logic"""
        # Setup Selenium
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(options=chrome_options)
        
        try:
            # Define search URLs
            search_urls = [
                f'{self.base_url}/propiedades/venta/departamentos',
                f'{self.base_url}/propiedades/alquiler/departamentos',
                # Add more URLs as needed
            ]
            
            properties_count = 0
            
            for url in search_urls:
                self.logger.info(f"Scraping: {url}")
                
                # Navigate to page
                driver.get(url)
                
                # Wait for listings to load
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "listing-item"))
                )
                
                # Extract listings
                listings = driver.find_elements(By.CLASS_NAME, "listing-item")
                
                for listing in listings:
                    try:
                        # Extract data (adjust selectors based on actual HTML)
                        property_data = {
                            'externalId': listing.get_attribute('data-id'),
                            'title': listing.find_element(By.CLASS_NAME, 'title').text,
                            'price': self.parse_price(listing.find_element(By.CLASS_NAME, 'price').text),
                            'currency': 'USD',
                            'area': self.parse_area(listing.find_element(By.CLASS_NAME, 'area').text),
                            'bedrooms': self.parse_number(listing.find_element(By.CLASS_NAME, 'bedrooms').text),
                            'bathrooms': self.parse_number(listing.find_element(By.CLASS_NAME, 'bathrooms').text),
                            'district': listing.find_element(By.CLASS_NAME, 'district').text,
                            'operationType': 'venta' if 'venta' in url else 'alquiler',
                            'propertyType': 'departamento',
                            'sourceUrl': listing.find_element(By.TAG_NAME, 'a').get_attribute('href'),
                            'imageUrl': listing.find_element(By.TAG_NAME, 'img').get_attribute('src'),
                            # Add more fields as needed
                        }
                        
                        # Save to database
                        if self.save_property(property_data):
                            properties_count += 1
                    
                    except Exception as e:
                        self.logger.error(f"Error extracting property: {str(e)}")
                        continue
            
            return properties_count
            
        finally:
            driver.quit()
    
    def parse_price(self, price_text):
        """Extract numeric price from text"""
        import re
        numbers = re.findall(r'\d+', price_text.replace(',', ''))
        return float(''.join(numbers)) if numbers else None
    
    def parse_area(self, area_text):
        """Extract numeric area from text"""
        import re
        numbers = re.findall(r'\d+\.?\d*', area_text)
        return float(numbers[0]) if numbers else None
    
    def parse_number(self, text):
        """Extract integer from text"""
        import re
        numbers = re.findall(r'\d+', text)
        return int(numbers[0]) if numbers else None
```

---

### Paso 2: Registrar el Scraper

Edita `run_scrapers.py` y agrega tu nuevo scraper:

```python
from adondevivir import AdondevivirScraper  # Importar

def run_all_scrapers():
    scrapers = [
        ('Urbania', UrbaniaScraper),
        ('Adondevivir', AdondevivirScraper),  # ← Agregar aquí
        # Add more...
    ]
    # ... rest of code
```

---

### Paso 3: Probar el Scraper

```bash
cd /home/ubuntu/real_estate_search_ai/scrapers
python3 adondevivir.py  # Probar individualmente
python3 run_scrapers.py  # Probar todos
```

---

## 🔍 Cómo Analizar un Portal

### 1. Inspeccionar HTML

Abre el portal en un navegador y usa DevTools (F12):
- Busca los selectores CSS de los listados
- Identifica clases/IDs para título, precio, área, etc.
- Verifica si usa JavaScript para cargar contenido

### 2. Determinar Estrategia

**Si el contenido se carga con JavaScript:**
- Usa Selenium (como en el ejemplo)

**Si el HTML es estático:**
- Puedes usar BeautifulSoup + Requests (más rápido):

```python
import requests
from bs4 import BeautifulSoup

response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')
listings = soup.find_all('div', class_='listing-item')
```

### 3. Manejar Anti-Scraping

Si el portal bloquea scrapers:
- Agrega delays entre requests: `time.sleep(2)`
- Usa user agents realistas
- Rota IPs si es necesario
- Considera usar proxies

---

## 📊 Campos Requeridos

Cada propiedad debe tener estos campos mínimos:

| Campo | Tipo | Requerido | Ejemplo |
|-------|------|-----------|---------|
| `externalId` | string | ✅ | "URB-12345" |
| `title` | string | ✅ | "Departamento en Miraflores" |
| `operationType` | enum | ✅ | "venta" o "alquiler" |
| `propertyType` | string | ✅ | "departamento", "casa", "oficina" |
| `price` | decimal | ✅ | 150000.00 |
| `currency` | string | ✅ | "USD" o "PEN" |
| `district` | string | ✅ | "Miraflores" |
| `sourceUrl` | string | ✅ | URL del listado original |
| `area` | decimal | ⚪ | 85.5 |
| `bedrooms` | int | ⚪ | 2 |
| `bathrooms` | int | ⚪ | 2 |
| `imageUrl` | string | ⚪ | URL de la foto principal |
| `amenities` | JSON array | ⚪ | ["Piscina", "Gimnasio"] |

---

## 🔧 Utilidades de la Clase Base

La clase `BaseScraper` proporciona:

### Métodos Útiles

```python
# Guardar propiedad en DB
self.save_property(property_data)  # Returns True/False

# Logging
self.logger.info("Mensaje informativo")
self.logger.error("Mensaje de error")

# Conexión a DB
self.connect_db()  # Conectar
self.close_db()    # Cerrar
```

### Propiedades

```python
self.portal_name  # Nombre del portal
self.logger       # Logger configurado
self.db_conn      # Conexión a MySQL
```

---

## ⚙️ Configuración

### Variables de Entorno

El sistema usa estas variables (ya configuradas):
- `DATABASE_URL`: Conexión a MySQL/TiDB
- Otras configuraciones en `config.py`

### Frecuencia de Ejecución

Edita `setup_cron.sh` para cambiar la frecuencia:

```bash
# Actual: 6 AM y 6 PM
CRON_JOB="0 6,18 * * * ..."

# Cada 6 horas:
CRON_JOB="0 */6 * * * ..."

# Cada hora:
CRON_JOB="0 * * * * ..."
```

---

## 📝 Checklist para Nuevo Scraper

- [ ] Crear archivo `portal_name.py`
- [ ] Heredar de `BaseScraper`
- [ ] Implementar método `scrape()`
- [ ] Probar extracción de datos
- [ ] Verificar que se guarden en DB
- [ ] Agregar a `run_scrapers.py`
- [ ] Probar ejecución completa
- [ ] Actualizar panel admin (opcional)

---

## 🐛 Debugging

### Ver logs

```bash
# Logs de cron jobs
tail -f /home/ubuntu/real_estate_search_ai/logs/scrapers.log

# Ejecutar manualmente con logs
cd /home/ubuntu/real_estate_search_ai/scrapers
python3 run_scrapers.py
```

### Problemas Comunes

**Error: "Cannot connect to database"**
- Verifica `DATABASE_URL` en variables de entorno

**Error: "Element not found"**
- Los selectores CSS cambiaron
- Actualiza los selectores en el scraper

**Scraper muy lento**
- Reduce el número de páginas a scrapear
- Usa BeautifulSoup en lugar de Selenium si es posible

---

## 📚 Recursos

- [Selenium Documentation](https://selenium-python.readthedocs.io/)
- [BeautifulSoup Documentation](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [MySQL Connector Python](https://dev.mysql.com/doc/connector-python/en/)

---

## 🎯 Próximos Portales a Implementar

1. **Adondevivir** - Similar a Urbania
2. **Infocasas** - Estructura diferente
3. **Properati** - Usa API interna
4. **Babilonia** - HTML estático
5. ... (10 más)

---

## 💡 Tips

1. **Empieza simple**: Extrae solo los campos básicos primero
2. **Prueba frecuentemente**: Ejecuta el scraper después de cada cambio
3. **Maneja errores**: Usa try/except para evitar que un error detenga todo
4. **Documenta selectores**: Anota qué selector corresponde a qué campo
5. **Respeta robots.txt**: Verifica las políticas del sitio

---

¿Preguntas? Revisa el código de `urbania.py` como referencia completa.
