# Guía de Uso - Sistema de Scrapers Inmobiliarios

## 🚀 Inicio Rápido

### Ejecutar todos los scrapers funcionales

```bash
cd /home/ubuntu/real_estate_search_ai
./run_all_scrapers.sh
```

### Ver progreso en tiempo real

```bash
# Ver todos los scrapers
ps aux | grep 'python3 scrapers'

# Ver log de un scraper específico
tail -f /tmp/scraper_logs/urbania.log
```

### Detener todos los scrapers

```bash
pkill -f 'python3 scrapers/'
```

---

## ⏰ Gestión de Cron Jobs (Ejecución Automática)

### Instalar cron jobs (ejecutar cada 12 horas)

```bash
cd /home/ubuntu/real_estate_search_ai
./cron_manager.sh install
```

### Ver estado actual

```bash
./cron_manager.sh status
```

### Pausar temporalmente

```bash
./cron_manager.sh pause
# o
./cron_manager.sh disable
```

### Reanudar ejecución

```bash
./cron_manager.sh resume
# o
./cron_manager.sh enable
```

### Desinstalar completamente

```bash
./cron_manager.sh uninstall
```

---

## 📊 Scrapers Disponibles

### ✅ Funcionales (9)

1. **Urbania** - `python3 scrapers/urbania.py`
2. **Adondevivir** - `python3 scrapers/adondevivir.py`
3. **Infocasas** - `python3 scrapers/infocasas.py`
4. **Properati** - `python3 scrapers/properati.py`
5. **Babilonia** - `python3 scrapers/babilonia.py`
6. **Los Portales** - `python3 scrapers/losportales.py`
7. **Nexo Inmobiliario** - `python3 scrapers/nexoinmobiliario.py`
8. **Mitula** - `python3 scrapers/mitula.py`
9. **La Encontré** - `python3 scrapers/laencontre.py`

### ⚠️ Requieren Ajustes (4)

10. **FazWaz** - `python3 scrapers/fazwaz.py`
11. **Ubicasa** - `python3 scrapers/ubicasa.py`
12. **Mercado Libre** - `python3 scrapers/mercadolibre.py`
13. **RE/MAX** - `python3 scrapers/remax.py`

---

## 📱 Datos Extraídos

Cada scraper extrae:

### Datos Básicos
- Título, tipo de propiedad, precio, moneda
- Ubicación (distrito, provincia, departamento)
- Área, dormitorios, baños
- Amenidades, descripción, imágenes
- URL del anuncio original

### Datos de Contacto
- Nombre del propietario/agente
- Teléfono
- WhatsApp
- Email

---

## 🔍 Búsquedas Específicas

### Ejemplo: Casas en Pueblo Libre/Surco, USD$ 300k-1.3M

```sql
SELECT 
    title,
    propertyType,
    district,
    price,
    currency,
    bedrooms,
    bathrooms,
    area,
    ownerPhone,
    ownerWhatsapp,
    ownerEmail,
    sourceUrl,
    portal
FROM properties
WHERE 
    operationType = 'venta'
    AND propertyType LIKE '%casa%'
    AND (district LIKE '%Pueblo Libre%' OR district LIKE '%Surco%')
    AND currency = 'USD'
    AND price BETWEEN 300000 AND 1300000
ORDER BY createdAt DESC;
```

---

## 📈 Monitoreo

### Ver propiedades por portal

```sql
SELECT portal, COUNT(*) as total
FROM properties
GROUP BY portal
ORDER BY total DESC;
```

### Ver propiedades con datos de contacto

```sql
SELECT 
    portal,
    COUNT(*) as total,
    SUM(CASE WHEN ownerWhatsapp IS NOT NULL THEN 1 ELSE 0 END) as con_whatsapp,
    SUM(CASE WHEN ownerPhone IS NOT NULL THEN 1 ELSE 0 END) as con_telefono,
    SUM(CASE WHEN ownerEmail IS NOT NULL THEN 1 ELSE 0 END) as con_email
FROM properties
GROUP BY portal
ORDER BY total DESC;
```

---

## 🔧 Solución de Problemas

### Los scrapers no extraen datos

**Solución**: Verificar logs en `/tmp/scraper_logs/`

### Timeout al cargar páginas

**Solución**: Los sitios pueden estar lentos, esperar o reintentar

### Error de conexión a base de datos

**Solución**: Verificar variable de entorno `DATABASE_URL`

### Error al descargar WebDriver (msedgedriver / chromedriver)

Si los scrapers no pueden iniciar Selenium y muestran errores relacionados con la descarga de `msedgedriver` o `chromedriver`, puedes usar un driver local:

1. Descarga el driver correspondiente a tu navegador (Edge/Chrome) y colócalo en una carpeta del sistema.
2. Crea o edita el archivo `.env` en la raíz del proyecto y agrega:

```env
EDGE_DRIVER_PATH=C:\ruta\a\msedgedriver.exe
# o para Chrome:
# CHROME_DRIVER_PATH=C:\ruta\a\chromedriver.exe
```

3. Ejecuta de nuevo el scraper (por ejemplo `python scrapers/run_scrapers.py`).

---

## 📞 Soporte

Para más información, revisar:
- `scrapers/README.md` - Guía técnica completa
- `scrapers/OCTOPARSE_FACEBOOK_TIKTOK_GUIDE.md` - Guía de Octoparse
