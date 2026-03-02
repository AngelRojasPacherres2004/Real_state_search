# Análisis de Estructura de Urbania.pe

## URL Base
https://urbania.pe/buscar/venta-de-departamentos

## Estructura de Listados

### Información visible en cada card:
1. **Precio**: "S/ 211,700" o "USD 136,416"
2. **Dirección**: "Av. Javier Prado Oeste 769"
3. **Distrito**: "San Isidro, Lima"
4. **Unidades**: "606 un."
5. **Dormitorios**: "1 a 3 dorm."
6. **Área**: "26 a 75 m² tot."
7. **Amenidades**: Gimnasio, Piscina, Parrilla, Áreas verdes, etc.
8. **Descripción**: Texto descriptivo del proyecto
9. **Estado**: "En planos", "En construcción", "Entrega inmediata"
10. **Fecha de entrega**: "Entrega diciembre 2028"

## Selectores CSS Potenciales
- Cards de propiedades parecen estar en divs con imágenes
- Precio: texto que empieza con "S/" o "USD"
- Ubicación: formato "Distrito, Provincia"
- Amenidades: lista de características

## Estrategia de Scraping
1. Obtener lista de propiedades de la página de búsqueda
2. Para cada propiedad, extraer:
   - ID único (del URL o atributo)
   - Precio (convertir S/ a USD si es necesario)
   - Ubicación (distrito, dirección)
   - Características (dorm, baños, área)
   - Amenidades
   - URL de la propiedad individual
   - URL de imagen principal
3. Manejar paginación para obtener más resultados
4. Guardar en base de datos

## Notas
- El sitio tiene 16,564 departamentos en venta
- Usa JavaScript para cargar contenido dinámico
- Puede requerir Selenium en lugar de requests simples
