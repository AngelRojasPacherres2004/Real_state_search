# Análisis de Estructura de Portales

## La Encontré (laencontre.com.pe)
- **Estructura**: Portal con URLs no predecibles, requiere navegación interactiva
- **Dificultad**: Alta - Requiere análisis más profundo de la estructura de URLs
- **Estrategia**: Implementar después de Mitula y Nexo Inmobiliario

## Mitula (casas.mitula.pe)
- **URL Base**: https://casas.mitula.pe/
- **URL de Búsqueda**: https://casas.mitula.pe/casas/st-lima-metropolitana
- **Estructura de Tarjetas**: `<article>` con clase específica
- **Datos Disponibles**:
  - Tipo de propiedad (Casa, Minidepartamento, etc.)
  - Precio (USD/S/)
  - Ubicación (distrito)
  - Dormitorios y baños
  - Área en m²
  - Amenidades (lista de características)
  - Fecha de publicación
  - Inmobiliaria/fuente
- **Paginación**: Scroll infinito o paginación estándar
- **Dificultad**: Media - Estructura clara y consistente

## Nexo Inmobiliario (nexoinmobiliario.pe)
- **URL Base**: https://nexoinmobiliario.pe/
- **Enfoque**: Principalmente proyectos inmobiliarios nuevos
- **Estructura de Tarjetas**: `<article>` con información de proyectos
- **Datos Disponibles**:
  - Nombre del proyecto
  - Precio desde
  - Ubicación (dirección y distrito)
  - Rango de áreas (m²)
  - Rango de dormitorios
  - Inmobiliaria desarrolladora
- **Dificultad**: Baja - Estructura simple y clara
- **Nota**: Similar a Los Portales, enfocado en proyectos más que propiedades individuales

## Orden de Implementación
1. **Nexo Inmobiliario** - Más simple, similar a Los Portales
2. **Mitula** - Estructura estándar de portal de clasificados
3. **La Encontré** - Requiere análisis adicional de URLs
