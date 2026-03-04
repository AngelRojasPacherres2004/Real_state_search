export function generateMockProperties(count: number = 20) {
  const portals = ['urbania', 'babilonia', 'infocasas', 'properati', 'adondevivir', 'fazwaz', 'ubicasa', 'losportales', 'laencontre', 'mitula', 'nexoinmobiliario', 'facebook', 'mercadolibre', 'tiktok'];
  const districts = ['San Isidro', 'Pueblo Libre', 'Jesús María', 'Lince', 'Magdalena', 'Miraflores', 'San Borja', 'Barranco', 'Surco', 'La Molina', 'Lima Cercado', 'Bellavista', 'Surquillo', 'Ate', 'La Victoria', 'Breña'];
  const propertyTypes = ['Departamento', 'Casa', 'Oficina'];
  const operationTypes: ('alquiler' | 'venta')[] = ['alquiler', 'venta'];

  const properties: any[] = [];

  for (let i = 0; i < count; i++) {
    const portal = portals[Math.floor(Math.random() * portals.length)];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const operationType = operationTypes[Math.floor(Math.random() * operationTypes.length)];
    const bedrooms = Math.floor(Math.random() * 4) + 1;
    const bathrooms = Math.floor(Math.random() * 3) + 1;

    let area: number;
    if (propertyType === 'Casa') {
      area = Math.floor(Math.random() * 850) + 150;
    } else if (propertyType === 'Departamento') {
      area = Math.floor(Math.random() * 200) + 50;
    } else {
      area = Math.floor(Math.random() * 460) + 40;
    }

    let basePrice: number;
    if (operationType === 'alquiler') {
      if (propertyType === 'Casa') {
        basePrice = 1500 + Math.random() * 4000;
      } else if (propertyType === 'Departamento') {
        basePrice = 800 + Math.random() * 2000;
      } else {
        basePrice = 600 + Math.random() * 2400;
      }
    } else {
      if (propertyType === 'Casa') {
        basePrice = 200000 + Math.random() * 3800000;
      } else if (propertyType === 'Departamento') {
        const priceCategory = Math.random();
        if (priceCategory < 0.3) {
          basePrice = 50000 + Math.random() * 100000;
        } else if (priceCategory < 0.6) {
          basePrice = 150000 + Math.random() * 150000;
        } else {
          basePrice = 300000 + Math.random() * 500000;
        }
      } else {
        basePrice = 80000 + Math.random() * 420000;
      }
    }

    properties.push({
      externalId: `${portal}-${Date.now()}-${i}`,
      portal,
      title: `${propertyType} en ${district} - ${bedrooms} dormitorios`,
      description: `Hermoso ${propertyType.toLowerCase()} en ${district} con ${bedrooms} dormitorios y ${bathrooms} baños. Área total: ${area}m². Excelente ubicación cerca de áreas verdes, colegios y centros comerciales.`,
      operationType,
      propertyType,
      price: Math.round(basePrice),
      currency: 'USD',
      area,
      bedrooms,
      bathrooms,
      district,
      province: 'Lima',
      department: 'Lima',
      address: `Calle Ejemplo ${Math.floor(Math.random() * 500) + 1}, ${district}`,
      latitude: -12.0 + Math.random() * 0.1,
      longitude: -77.0 + Math.random() * 0.1,
      imageUrl: `https://via.placeholder.com/400x300?text=${propertyType}+${district}`,
      sourceUrl: `https://${portal}.pe/propiedad/${Date.now()}-${i}`,
      amenities: ['Estacionamiento', 'Seguridad 24h', 'Ascensor', 'Gimnasio'].slice(0, Math.floor(Math.random() * 4) + 1),
    });
  }

  return properties;
}
