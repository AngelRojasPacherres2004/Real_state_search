import ExcelJS from 'exceljs';
import type { Property } from '../drizzle/schema';

export async function exportPropertiesToExcel(properties: Property[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Propiedades');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Portal', key: 'portal', width: 15 },
    { header: 'Tipo Operación', key: 'operationType', width: 15 },
    { header: 'Tipo Propiedad', key: 'propertyType', width: 15 },
    { header: 'Título', key: 'title', width: 40 },
    { header: 'Descripción Completa', key: 'fullDescription', width: 60 },
    { header: 'Precio', key: 'price', width: 12 },
    { header: 'Moneda', key: 'currency', width: 10 },
    { header: 'Área (m²)', key: 'area', width: 12 },
    { header: 'Dormitorios', key: 'bedrooms', width: 12 },
    { header: 'Baños', key: 'bathrooms', width: 12 },
    { header: 'Distrito', key: 'district', width: 20 },
    { header: 'Provincia', key: 'province', width: 20 },
    { header: 'Dirección', key: 'address', width: 40 },
    { header: 'Latitud', key: 'latitude', width: 15 },
    { header: 'Longitud', key: 'longitude', width: 15 },
    { header: 'Amenidades', key: 'amenities', width: 40 },
    { header: 'Amenidades del Edificio', key: 'buildingAmenities', width: 40 },
    { header: 'Lugares Cercanos', key: 'nearbyPlaces', width: 40 },
    { header: 'Nombre Propietario', key: 'ownerName', width: 25 },
    { header: 'Teléfono Propietario', key: 'ownerPhone', width: 20 },
    { header: 'Email Propietario', key: 'ownerEmail', width: 30 },
    { header: 'WhatsApp Propietario', key: 'ownerWhatsapp', width: 20 },
    { header: 'Nombre Agente', key: 'agentName', width: 25 },
    { header: 'Empresa Agente', key: 'agentCompany', width: 25 },
    { header: 'URL Imagen', key: 'imageUrl', width: 50 },
    { header: 'URL Fuente', key: 'sourceUrl', width: 50 },
    { header: 'Fecha Scraping', key: 'scrapedAt', width: 20 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data rows
  properties.forEach((property) => {
    const row = worksheet.addRow({
      id: property.id,
      portal: property.portal,
      operationType: property.operationType === 'alquiler' ? 'Alquiler' : 'Venta',
      propertyType: property.propertyType,
      title: property.title,
      fullDescription: property.fullDescription || property.description || '-',
      price: property.price ? parseFloat(property.price.toString()) : 0,
      currency: property.currency,
      area: property.area ? parseFloat(property.area.toString()) : null,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      district: property.district,
      province: property.province,
      address: property.address,
      latitude: property.latitude ? parseFloat(property.latitude.toString()) : null,
      longitude: property.longitude ? parseFloat(property.longitude.toString()) : null,
      amenities: property.amenities || '-',
      buildingAmenities: property.buildingAmenities || '-',
      nearbyPlaces: property.nearbyPlaces || '-',
      ownerName: property.ownerName || '-',
      ownerPhone: property.ownerPhone || '-',
      ownerEmail: property.ownerEmail || '-',
      ownerWhatsapp: property.ownerWhatsapp || '-',
      agentName: property.agentName || '-',
      agentCompany: property.agentCompany || '-',
      imageUrl: property.imageUrl,
      sourceUrl: property.sourceUrl,
      scrapedAt: property.scrapedAt ? new Date(property.scrapedAt).toLocaleString('es-PE') : '-',
    });

    // Apply alternating row colors
    if (row.number % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
    }
  });

  // Add filters to header row
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 28 }
  };

  // Freeze first row
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ];

  // Format price column as currency
  const priceColumn = worksheet.getColumn('price');
  priceColumn.numFmt = '#,##0.00';

  // Format area column
  const areaColumn = worksheet.getColumn('area');
  areaColumn.numFmt = '#,##0.00';

  // Add conditional formatting for price (highlight high prices)
  worksheet.addConditionalFormatting({
    ref: `G2:G${properties.length + 1}`,
    rules: [
      {
        type: 'colorScale',
        priority: 1,
        cfvo: [
          { type: 'min' },
          { type: 'percentile', value: 50 },
          { type: 'max' }
        ],
        color: [
          { argb: 'FF63BE7B' }, // Green
          { argb: 'FFFFEB84' }, // Yellow
          { argb: 'FFF8696B' }  // Red
        ]
      }
    ]
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function exportLeadsToExcel(leads: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leads');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Nombre', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Teléfono', key: 'phone', width: 20 },
    { header: 'Interesado en', key: 'interestedIn', width: 40 },
    { header: 'Fuente', key: 'source', width: 20 },
    { header: 'Estado', key: 'status', width: 15 },
    { header: 'Notas', key: 'notes', width: 50 },
    { header: 'Fecha Creación', key: 'createdAt', width: 20 },
    { header: 'Última Actualización', key: 'updatedAt', width: 20 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data rows
  leads.forEach((lead) => {
    const row = worksheet.addRow({
      id: lead.id,
      name: lead.name,
      email: lead.email || '-',
      phone: lead.phone || '-',
      interestedIn: lead.interestedIn || '-',
      source: lead.source || '-',
      status: lead.status,
      notes: lead.notes || '-',
      createdAt: new Date(lead.createdAt).toLocaleString('es-PE'),
      updatedAt: new Date(lead.updatedAt).toLocaleString('es-PE'),
    });

    // Apply alternating row colors
    if (row.number % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
    }

    // Color code by status
    const statusCell = row.getCell('status');
    switch (lead.status) {
      case 'nuevo':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' }
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        break;
      case 'contactado':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEAB308' }
        };
        statusCell.font = { bold: true };
        break;
      case 'calificado':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFA855F7' }
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        break;
      case 'convertido':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF22C55E' }
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        break;
      case 'descartado':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF6B7280' }
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        break;
    }
  });

  // Add filters
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 10 }
  };

  // Freeze first row
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ];

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
