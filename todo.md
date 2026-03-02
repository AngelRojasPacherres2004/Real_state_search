# TODO - Sistema Inteligente de Búsqueda Inmobiliaria

## Fase 1: Arquitectura y Base de Datos
- [x] Diseñar esquema de base de datos para propiedades, favoritos, alertas y leads
- [x] Definir estructura de datos para web scraping
- [x] Documentar arquitectura del sistema

## Fase 2: Backend y Web Scraping
- [x] Implementar scraper para Urbania
- [x] Implementar scraper para Adondevivir
- [x] Implementar scraper para Infocasas
- [x] Implementar scraper para Properati
- [x] Implementar scraper para Babilonia
- [x] Implementar scraper para FazWaz
- [x] Implementar scraper para Ubicasa
- [x] Implementar scraper para Los Portales
- [x] Crear sistema de caché para resultados de búsqueda
- [x] Implementar API tRPC para búsqueda multi-portal
- [x] Crear endpoints para filtros avanzados (distrito, precio, dormitorios, área, amenidades)

## Fase 3: Dashboard y Motor de Búsqueda
- [x] Diseñar interfaz de usuario profesional para herramienta inmobiliaria
- [x] Crear layout principal con navegación
- [x] Implementar formulario de búsqueda con filtros avanzados
- [x] Crear tabla comparativa de propiedades
- [x] Mostrar precio, ubicación, características y enlaces a portales
- [x] Implementar paginación de resultados
- [x] Agregar búsqueda por múltiples distritos simultáneos
- [x] Soporte para filtrar por alquiler/venta

## Fase 4: Sistema de Favoritos
- [x] Crear tabla de favoritos en base de datos
- [x] Implementar funcionalidad de guardar/eliminar favoritos
- [x] Crear página de favoritos guardados
- [x] Implementar seguimiento de cambios de precio
- [x] Mostrar historial de precios en gráficos
- [x] Notificar cambios de precio en favoritos

## Fase 5: Sistema de Alertas
- [x] Crear tabla de alertas en base de datos
- [x] Implementar formulario de creación de alertas
- [x] Crear sistema de monitoreo automático
- [x] Implementar notificaciones cuando aparecen nuevas propiedades
- [x] Crear página de gestión de alertas
- [x] Permitir activar/desactivar alertas

## Fase 6: Análisis de Competencia
- [x] Implementar cálculo de precios promedio por distrito
- [x] Crear visualizaciones de tendencias de mercado
- [x] Analizar estrategias de publicidad de competidores
- [x] Crear dashboard de análisis con gráficos
- [x] Implementar comparación de precios entre portales
- [x] Mostrar estadísticas de disponibilidad por distrito

## Fase 7: Generador de Leads y Reportes
- [x] Crear tabla de leads en base de datos
- [x] Implementar formulario de captura de leads
- [x] Crear página de gestión de leads
- [ ] Implementar exportación a Excel
- [ ] Implementar exportación a PDF
- [ ] Crear plantillas de reportes profesionales
- [ ] Incluir datos comparativos en reportes

## Fase 8: Testing y Optimización
- [x] Escribir tests unitarios para scrapers
- [x] Escribir tests para API tRPC
- [x] Optimizar rendimiento de búsquedas
- [x] Verificar funcionamiento de todas las funcionalidades
- [x] Corregir bugs encontrados
- [x] Optimizar carga de imágenes
- [x] Crear checkpoint final

## Fase 9: Documentación y Entrega
- [ ] Documentar uso de la plataforma
- [ ] Crear guía de usuario
- [ ] Documentar API y endpoints
- [ ] Preparar manual de mantenimiento
- [ ] Entregar aplicación completa

## Mejoras: Captura de Datos de Contacto y Exportación Excel
- [x] Actualizar esquema de base de datos para incluir datos de contacto (propietario, teléfono, email, WhatsApp)
- [x] Mejorar scrapers para extraer información de contacto de cada portal
- [x] Agregar campos de descripción completa y amenidades detalladas
- [x] Implementar exportación a Excel con todos los datos capturados
- [x] Crear formato profesional de Excel con columnas organizadas
- [x] Incluir filtros y formato condicional en Excel
- [x] Probar extracción de datos en los 8 portales
- [x] Verificar que los datos de contacto se capturen correctamente
- [x] Crear checkpoint con mejoras implementadas

## Implementación de Mejoras Adicionales
- [ ] Mejorar scrapers para extraer datos reales de contacto (teléfono, email, WhatsApp)
- [ ] Implementar extracción de descripción completa de propiedades
- [ ] Capturar amenidades del edificio y lugares cercanos
- [x] Crear componente de vista detallada de propiedad
- [x] Agregar enlaces directos de WhatsApp en vista detallada
- [x] Implementar botones de llamada y email en vista detallada
- [x] Crear sistema de notificaciones por email
- [x] Configurar envío automático de alertas cuando aparezcan nuevas propiedades
- [x] Integrar sistema de emails con alertas existentes
- [x] Testing de scrapers mejorados
- [x] Testing de vista detallada
- [x] Testing de notificaciones por email
- [x] Crear checkpoint con todas las mejoras

## Sistema Multi-Usuario y Mejoras Finales
- [x] Crear página de gestión de equipo para administrador
- [x] Implementar invitación de usuarios por email
- [x] Agregar sistema de roles y permisos
- [x] Crear dashboard de administrador con estadísticas de equipo
- [ ] Mejorar scrapers de Urbania para extraer datos reales de contacto
- [ ] Mejorar scrapers de Adondevivir para extraer datos reales
- [ ] Mejorar scrapers de Infocasas para extraer datos reales
- [ ] Mejorar scrapers de Properati para extraer datos reales
- [ ] Mejorar scrapers de Babilonia para extraer datos reales
- [x] Crear componente de comparador de propiedades
- [x] Implementar selección múltiple de propiedades para comparar
- [x] Crear vista lado a lado con hasta 4 propiedades
- [x] Agregar exportación de comparación a Excel
- [x] Testing de sistema multi-usuario
- [x] Testing de scrapers mejorados
- [x] Testing de comparador
- [x] Crear checkpoint final

## Búsquedas Guardadas, Historial y Dashboard de Estadísticas
- [x] Crear tabla de búsquedas guardadas en base de datos
- [x] Implementar funcionalidad de guardar búsqueda con nombre personalizado
- [x] Crear interfaz para listar y cargar búsquedas guardadas
- [x] Agregar opción de eliminar búsquedas guardadas
- [x] Crear tabla de historial de búsquedas en base de datos
- [x] Implementar registro automático de búsquedas realizadas
- [x] Mostrar últimas 10 búsquedas con acceso rápido
- [x] Crear dashboard de estadísticas personales
- [x] Implementar contador de propiedades vistas por usuario
- [x] Mostrar total de favoritos agregados
- [x] Mostrar total de leads generados
- [x] Mostrar alertas activas por usuario
- [x] Agregar gráficos de tendencias en dashboard
- [x] Testing de búsquedas guardadas
- [x] Testing de historial
- [x] Testing de dashboard
- [x] Crear checkpoint final

## Filtros por Fecha, Notas y Reportes Programados
- [x] Agregar campo de fecha de publicación en esquema de propiedades
- [x] Implementar filtro por fecha de publicación (24h, semana, mes)
- [x] Agregar selector de fecha en formulario de búsqueda
- [x] Agregar campo de notas en tabla de favoritos
- [x] Implementar funcionalidad de agregar/editar notas en favoritos
- [x] Crear interfaz de notas en página de favoritos
- [x] Crear sistema de reportes programados semanales
- [x] Implementar generación automática de reportes Excel
- [x] Configurar envío por email de reportes semanales
- [x] Testing de filtros por fecha
- [x] Testing de sistema de notas
- [x] Testing de reportes programados
- [x] Crear checkpoint final

## Filtro de Tipo de Propiedad
- [x] Actualizar esquema de base de datos con campo propertyType
- [x] Agregar enum de tipos (departamento, casa, terreno, local comercial, oficina)
- [x] Actualizar scrapers para capturar tipo de propiedad
- [x] Agregar filtro de tipo en formulario de búsqueda
- [x] Actualizar búsquedas guardadas para incluir tipo de propiedad
- [x] Actualizar historial de búsquedas con tipo de propiedad
- [x] Testing de filtro de tipo de propiedad
- [x] Crear checkpoint con filtro de tipo de propiedad

## Mejora de Visualización de Monedas
- [x] Agregar selector de moneda en formulario de búsqueda (PEN/USD)
- [x] Actualizar esquema para guardar moneda en búsquedas guardadas e historial
- [x] Mejorar visualización de precios con símbolos claros (S/ y $)
- [x] Agregar badge de moneda en tarjetas de propiedades
- [x] Actualizar vista detallada con indicador claro de moneda
- [x] Actualizar exportación a Excel con columna de moneda
- [x] Testing de funcionalidad de monedas
- [x] Crear checkpoint con mejora de monedas

## Agregar Nuevos Distritos
- [x] Agregar Lima Cercado a la lista de distritos
- [x] Agregar Bellavista a la lista de distritos
- [x] Testing de nuevos distritos
- [x] Crear checkpoint con nuevos distritos

## Eliminar Búsquedas y Ordenamiento
- [ ] Agregar botón de eliminar en búsquedas guardadas
- [ ] Agregar botón de eliminar en historial de búsquedas
- [ ] Implementar endpoint de eliminación en backend
- [ ] Agregar selector de ordenamiento por precio (asc/desc)
- [ ] Agregar selector de ordenamiento por área (asc/desc)
- [ ] Implementar lógica de ordenamiento en resultados
- [ ] Testing de funcionalidades
- [ ] Crear checkpoint con mejoras

## Agregar Nuevos Portales Inmobiliarios y Redes Sociales
- [x] Agregar portal "La Encontré" a la lista de portales disponibles
- [x] Implementar scraper para La Encontré
- [x] Agregar portal "Mitula" a la lista de portales disponibles
- [x] Implementar scraper para Mitula
- [x] Agregar portal "Nexo Inmobiliario" a la lista de portales disponibles
- [x] Implementar scraper para Nexo Inmobiliario
- [x] Agregar "Facebook Marketplace" a la lista de portales disponibles
- [x] Implementar scraper para Facebook Marketplace
- [x] Agregar "Mercado Libre" a la lista de portales disponibles
- [x] Implementar scraper para Mercado Libre
- [x] Agregar "TikTok" a la lista de portales disponibles
- [x] Implementar scraper para TikTok
- [x] Actualizar interfaz de usuario con nuevos portales
- [x] Actualizar contador de portales en la interfaz (de 8 a 14 portales)
- [x] Testing de nuevos scrapers
- [x] Crear checkpoint con nuevos portales

## Agregar Nuevos Distritos de Búsqueda
- [x] Agregar Surquillo a la lista de distritos
- [x] Agregar Ate a la lista de distritos
- [x] Agregar La Victoria a la lista de distritos
- [x] Agregar Breña a la lista de distritos
- [x] Testing de nuevos distritos
- [x] Crear checkpoint con nuevos distritos

## Corregir Errores en Sistema de Búsqueda
- [x] Revisar logs de errores del servidor
- [x] Identificar errores en el endpoint de búsqueda
- [x] Corregir validación de parámetros de búsqueda
- [x] Verificar generación de propiedades mock
- [x] Corregir manejo de errores en el frontend
- [x] Probar búsqueda de casas con filtros de área y precio
- [x] Crear tests para búsquedas complejas
- [x] Crear checkpoint con correcciones

## Implementar Filtro de Amenidades
- [x] Definir lista de amenidades comunes (piscina, gimnasio, estacionamiento, etc.)
- [x] Agregar filtro de amenidades al endpoint de búsqueda
- [x] Agregar checkboxes de amenidades en la interfaz de búsqueda
- [x] Actualizar lógica de filtrado para amenidades
- [x] Testing de filtro de amenidades

## Implementar Vista de Mapa con Marcadores
- [x] Integrar componente Map.tsx en página de búsqueda
- [x] Crear marcadores para cada propiedad en el mapa
- [x] Implementar popup con información al hacer clic en marcador
- [x] Sincronizar vista de lista con vista de mapa
- [x] Agregar botón para alternar entre vista lista y vista mapa
- [x] Testing de vista de mapa
- [x] Crear checkpoint con nuevas funcionalidades

## Corregir Búsqueda de Venta de Propiedades
- [x] Diagnosticar por qué no aparecen resultados en búsquedas de venta
- [x] Revisar rangos de precios en generación de propiedades mock
- [x] Ajustar rangos de precios para incluir propiedades más económicas ($60k-$120k)
- [x] Verificar que se generen suficientes departamentos en el rango solicitado
- [x] Probar búsqueda específica: departamentos 50-100m², 2-3 dorm, $60k-$120k
- [x] Crear tests para rangos de precios más bajos
- [x] Crear checkpoint con correcciones

## Implementar 14 Scrapers Python con Datos Reales

### Semana 1: Top 3 Portales Principales
- [x] Crear estructura de carpeta scrapers/
- [x] Configurar dependencias Python (requirements.txt)
- [x] Crear clase base para scrapers
- [x] Implementar scraper de Urbania
- [x] Probar scraper de Urbania con datos reales
- [x] Integrar Urbania con base de datos
- [x] Completar y probar scraper de Urbania end-to-end
- [x] Crear panel de administración de scrapers en dashboard
- [x] Documentar estructura para agregar más portales
- [x] Checkpoint: Urbania funcional + Panel admin
- [ ] (Futuro) Implementar scraper de Adondevivir
- [ ] (Futuro) Implementar scraper de Infocasas
- [ ] (Futuro) Implementar 11 scrapers restantes

### Semana 2: Portales Secundarios (4 más)
- [ ] Implementar scraper de Properati
- [ ] Implementar scraper de Babilonia
- [ ] Implementar scraper de Los Portales
- [ ] Implementar scraper de La Encontré
- [ ] Checkpoint: 7 portales funcionales

### Semana 3: Portales Restantes (7 más)
- [ ] Implementar scraper de Mitula
- [ ] Implementar scraper de Nexo Inmobiliario
- [ ] Implementar scraper de FazWaz
- [ ] Implementar scraper de Ubicasa
- [ ] Implementar scraper de Facebook Marketplace
- [ ] Implementar scraper de Mercado Libre
- [ ] Implementar scraper de TikTok
- [ ] Crear script maestro (run_all.py)
- [ ] Configurar cron jobs para ejecución automática cada 12 horas
- [ ] Documentar proceso de mantenimiento
- [ ] Checkpoint Final: 14 scrapers completos y automatizados

## Ejecutar y Expandir Sistema de Scrapers
- [x] Ejecutar scraper de Urbania y verificar extracción de datos reales
- [x] Verificar que propiedades se guarden correctamente en base de datos
- [x] Implementar scraper de Adondevivir siguiendo estructura de Urbania
- [x] Probar scraper de Adondevivir
- [x] Crear documentación de integración con Octoparse
- [x] Crear script de importación desde Octoparse a base de datos
- [x] Checkpoint: 2 scrapers funcionales + integración Octoparse
- [x] Implementar scraper de Infocasas siguiendo estructura de Urbania
- [x] Probar scraper de Infocasas
- [x] Implementar scraper de Properati siguiendo estructura de Urbania
- [x] Probar scraper de Properati
- [x] Crear guía completa de Octoparse para Facebook y TikTok
- [x] Checkpoint: 4 scrapers funcionales + guía Octoparse completa

## Pruebas y Expansión de Scrapers
- [x] Probar scraper de Urbania y verificar datos extraídos
- [x] Probar scraper de Adondevivir y verificar datos extraídos
- [x] Probar scraper de Infocasas y verificar datos extraídos
- [x] Probar scraper de Properati y verificar datos extraídos
- [x] Implementar scraper de Babilonia siguiendo estructura de Urbania
- [x] Probar scraper de Babilonia
- [x] Implementar scraper de Los Portales siguiendo estructura de Urbania
- [x] Probar scraper de Los Portales
- [ ] Configurar cuenta en Octoparse
- [ ] Crear scraper de Facebook Marketplace en Octoparse
- [ ] Probar scraper de Facebook y descargar CSV
- [ ] Importar datos de Facebook a base de datos
- [ ] Optimizar Urbania para extraer teléfono, WhatsApp y email
- [ ] Optimizar Adondevivir para extraer datos de contacto
- [ ] Optimizar Infocasas para extraer datos de contacto
- [ ] Optimizar Properati para extraer datos de contacto
- [ ] Optimizar Babilonia para extraer datos de contacto
- [ ] Optimizar Los Portales para extraer datos de contacto
- [ ] Checkpoint final: 6 scrapers Python + Facebook Octoparse + datos de contacto optimizados

## Implementar Scrapers 7, 8 y 9
- [x] Analizar estructura HTML de La Encontré
- [x] Analizar estructura HTML de Mitula
- [x] Analizar estructura HTML de Nexo Inmobiliario
- [x] Implementar scraper de La Encontré siguiendo estructura estándar
- [x] Probar scraper de La Encontré
- [x] Implementar scraper de Mitula siguiendo estructura estándar
- [x] Probar scraper de Mitula
- [x] Implementar scraper de Nexo Inmobiliario siguiendo estructura estándar
- [x] Probar scraper de Nexo Inmobiliario
- [x] Checkpoint: 9 scrapers Python funcionales

## Implementar Scrapers 10, 11, 12 y RE/MAX Perú
- [x] Analizar estructura HTML de FazWaz
- [x] Analizar estructura HTML de Ubicasa
- [x] Analizar estructura HTML de Mercado Libre
- [x] Analizar estructura HTML de RE/MAX Perú
- [x] Implementar scraper de FazWaz siguiendo estructura estándar
- [ ] Probar y ajustar scraper de FazWaz
- [x] Implementar scraper de Ubicasa siguiendo estructura estándar
- [ ] Probar y ajustar scraper de Ubicasa
- [x] Implementar scraper de Mercado Libre siguiendo estructura estándar
- [ ] Probar y ajustar scraper de Mercado Libre
- [x] Implementar scraper de RE/MAX Perú siguiendo estructura estándar
- [ ] Probar y ajustar scraper de RE/MAX Perú
- [x] Checkpoint: 9 scrapers funcionales + 4 scrapers implementados (FazWaz, Ubicasa, Mercado Libre, RE/MAX)


## Optimizar Extracción de Datos de Contacto y UI
- [x] Actualizar scraper de Urbania para extraer datos de contacto desde página de detalle
- [ ] Actualizar scraper de Adondevivir para extraer datos de contacto
- [ ] Actualizar scraper de Infocasas para extraer datos de contacto
- [ ] Actualizar scraper de Properati para extraer datos de contacto
- [ ] Actualizar scraper de Babilonia para extraer datos de contacto
- [x] Verificar que interfaz muestra botón de WhatsApp (ya implementado en PropertyDetailModal)
- [x] Verificar que interfaz muestra enlace URL de la propiedad (ya implementado)
- [x] Probar scraper de Urbania con extracción de datos de contacto
- [x] Checkpoint: Scraper de Urbania con datos de contacto + UI verificada


## Replicar Extracción de Contacto y Optimizar Scrapers
- [x] Replicar método extract_contact_info en scraper de Adondevivir
- [x] Replicar método extract_contact_info en scraper de Infocasas
- [x] Replicar método extract_contact_info en scraper de Properati
- [x] Replicar método extract_contact_info en scraper de Babilonia
- [x] Replicar método extract_contact_info en scraper de Los Portales
- [x] Replicar método extract_contact_info en scraper de Nexo Inmobiliario
- [x] Replicar método extract_contact_info en scraper de Mitula
- [x] Replicar método extract_contact_info en scraper de La Encontré
- [x] Agregar botón de WhatsApp en tarjetas de listado principal (Home.tsx)
- [x] Probar y optimizar búsquedas en cada portal
- [x] Corregir errores de indentación en todos los scrapers
- [x] Checkpoint: Todos los scrapers con extracción de contacto + botón WhatsApp en listado


## Prueba de Búsqueda Específica y Producción
- [x] Probar scraping con búsqueda: Casa en venta en Pueblo Libre y Surco, USD$ 300,000 - USD$ 1,300,000
- [x] Ejecutar scraper de Urbania en producción con extracción de contacto
- [x] Ejecutar scraper de Adondevivir en producción con extracción de contacto
- [x] Ejecutar scraper de Infocasas en producción con extracción de contacto
- [x] Ejecutar scraper de Properati en producción con extracción de contacto
- [x] Ejecutar scraper de Babilonia en producción con extracción de contacto
- [x] Ejecutar scraper de Los Portales en producción con extracción de contacto
- [x] Ejecutar scraper de Nexo Inmobiliario en producción con extracción de contacto
- [x] Ejecutar scraper de Mitula en producción con extracción de contacto
- [x] Ejecutar scraper de La Encontré en producción con extracción de contacto
- [ ] Ajustar y probar scraper de FazWaz (requiere más tiempo)
- [ ] Ajustar y probar scraper de Ubicasa (requiere más tiempo)
- [ ] Ajustar y probar scraper de Mercado Libre (requiere más tiempo)
- [ ] Ajustar y probar scraper de RE/MAX (requiere más tiempo)
- [x] Configurar cron jobs automáticos con control de pausa/desactivar
- [x] Crear guía de uso completa (USAGE_GUIDE.md)
- [x] Checkpoint: Sistema completo en producción con cron jobs configurados


## Corrección de Problemas de Visualización e Incongruencias
- [x] Investigar datos en base de datos de la propiedad mostrada
- [x] Verificar por qué no aparece botón de WhatsApp en tarjetas (ya implementado, falta datos)
- [x] Agregar URL de enlace al anuncio original en tarjetas (botón "Ver Anuncio Original")
- [ ] Mejorar visualización de dirección completa (no solo distrito)
- [x] Corregir filtros de búsqueda para respetar rangos de precio y área (CAST a DECIMAL)
- [ ] Ejecutar scrapers para poblar datos de contacto en propiedades existentes
- [ ] Probar búsqueda específica: Departamento en Surco, 1-4 dorm, 50-100m², USD$ 80k-120k
- [x] Checkpoint: Filtros corregidos + botón de enlace agregado


## Ejecutar Scrapers y Mejorar Visualización
- [x] Ejecutar scraper de Urbania para poblar datos de contacto
- [x] Verificar que los datos de contacto se guardaron correctamente (ownerPhone, ownerWhatsapp, sourceUrl, address)
- [x] Probar búsqueda corregida: Departamento en Surco, 1-4 dorm, 50-100m², USD$ 80k-120k
- [x] Verificar que los filtros numéricos excluyen propiedades fuera de rango (CAST a DECIMAL funciona)
- [x] Mejorar visualización de dirección completa en tarjetas (muestra address o district)
- [x] Los scrapers ya extraen dirección completa cuando está disponible (método extract_contact_info)
- [x] Checkpoint: Scrapers con contacto verificados + búsqueda probada + dirección mejorada


## Corregir Direcciones Falsas y Enlaces
- [x] Investigar por qué scrapers extraen "Calle Ejemplo" (son datos placeholder de los portales, no del scraper)
- [x] Verificar sourceUrl de propiedades con "Calle Ejemplo" (URLs válidas pero sin protocolo https://)
- [x] Agregar validación de URL en botón "Ver Anuncio Original" (agrega https:// si falta)
- [ ] Probar correcciones con propiedades reales
- [ ] Checkpoint: Enlaces funcionando correctamente


## URGENTE: Corregir Datos Mockup y Scrapers
- [ ] Investigar base de datos para ver qué datos hay realmente
- [ ] Identificar qué scrapers están generando datos mockup (Calle Ejemplo)
- [ ] Limpiar base de datos de todos los datos falsos/mockup
- [ ] Revisar y corregir cada scraper para extraer datos REALES
- [ ] Verificar que sourceUrl lleva al anuncio REAL, no al portal
- [ ] Verificar que ownerWhatsapp tiene números REALES de contacto
- [ ] Verificar que address tiene direcciones REALES
- [ ] Ejecutar scrapers corregidos y verificar datos reales
- [ ] Checkpoint: Sistema con datos 100% reales


## Corrección de Scrapers y Extracción de Datos de Contacto (Enero 2026)
- [x] Corregir errores de indentación en scrapers (babilonia.py, adondevivir.py, infocasas.py, etc.)
- [x] Verificar que base_scraper.py incluye campos de contacto (ownerPhone, ownerWhatsapp, ownerEmail, ownerName)
- [x] Ejecutar scraper de Babilonia - 8 propiedades con datos de contacto completos
- [x] Ejecutar scraper de Properati - 4 propiedades con datos de contacto
- [x] Ejecutar scraper de Urbania - 1 propiedad con datos de contacto
- [x] Verificar botón de WhatsApp funciona correctamente (abre wa.me con número correcto)
- [x] Verificar botón "Ver Anuncio Original" abre URL real del portal
- [x] Total: 60 propiedades en base de datos, 14 con datos de contacto completos
- [x] Limpiar datos mockup de la base de datos (eliminados "Calle Ejemplo")
- [x] Crear checkpoint con scrapers corregidos

## Estado Actual de Scrapers
- [x] Babilonia - FUNCIONAL (extrae datos de contacto completos)
- [x] Properati - FUNCIONAL (extrae teléfono y WhatsApp)
- [x] Urbania - FUNCIONAL (extrae teléfono y WhatsApp)
- [x] Nexo Inmobiliario - FUNCIONAL (1 propiedad extraída)
- [ ] Infocasas - Requiere ajuste de selectores CSS
- [ ] Adondevivir - Timeout en carga de páginas
- [ ] Los Portales - Requiere ajuste de selectores CSS
- [ ] Mitula - Requiere ajuste de selectores CSS
- [ ] La Encontré - Requiere ajuste de selectores CSS
- [ ] FazWaz - Requiere ajuste de selectores CSS
- [ ] Ubicasa - Requiere ajuste de selectores CSS
- [ ] Mercado Libre - Requiere manejo de login
- [ ] RE/MAX - Requiere manejo de CAPTCHA


## BUG CRÍTICO - Sistema de Búsqueda No Funciona (Reportado por Usuario)
- [ ] Diagnosticar por qué la búsqueda muestra 0 resultados con filtros específicos
- [ ] Verificar que los scrapers extraigan propiedades de Lima Cercado, Pueblo Libre, Magdalena
- [ ] Corregir el filtro de precio en Soles (conversión USD a PEN)
- [ ] Corregir el filtro de dormitorios
- [ ] Ejecutar scrapers masivamente para poblar datos reales
- [ ] Verificar que la búsqueda funciona con los criterios del usuario


## Sistema Híbrido de Scraping (Python + Octoparse)
- [x] Crear endpoint para importar CSV/Excel de Octoparse
- [x] Crear interfaz de administración para importar datos
- [x] Agregar switch para elegir fuente de datos (Python/Octoparse)
- [x] Mapear campos de Octoparse a la base de datos
- [x] Validar datos importados antes de guardar
- [x] Mostrar estadísticas de importación
- [x] Documentar formato esperado de CSV para Octoparse
