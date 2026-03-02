import * as db from "./db";

// Mapeo de campos de Octoparse a campos de la base de datos
interface OctoparseProperty {
  // Campos comunes que Octoparse puede extraer
  titulo?: string;
  title?: string;
  precio?: string;
  price?: string;
  direccion?: string;
  address?: string;
  distrito?: string;
  district?: string;
  dormitorios?: string;
  bedrooms?: string;
  banos?: string;
  bathrooms?: string;
  area?: string;
  area_m2?: string;
  descripcion?: string;
  description?: string;
  url?: string;
  sourceUrl?: string;
  link?: string;
  imagen?: string;
  image?: string;
  imageUrl?: string;
  portal?: string;
  source?: string;
  telefono?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  propietario?: string;
  owner?: string;
  agente?: string;
  agent?: string;
  tipo_operacion?: string;
  operationType?: string;
  tipo_propiedad?: string;
  propertyType?: string;
  moneda?: string;
  currency?: string;
  amenidades?: string;
  amenities?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: number;
  duplicates: number;
  errorMessages: string[];
}

// Función para normalizar el precio
function normalizePrice(priceStr: string | undefined): { price: number; currency: string } {
  if (!priceStr) return { price: 0, currency: 'USD' };
  
  const cleanPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '');
  const price = parseFloat(cleanPrice) || 0;
  
  // Detectar moneda
  const currency = priceStr.includes('S/') || priceStr.toLowerCase().includes('soles') ? 'PEN' : 'USD';
  
  return { price, currency };
}

// Función para normalizar números
function normalizeNumber(numStr: string | undefined): number | null {
  if (!numStr) return null;
  const num = parseInt(numStr.replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? null : num;
}

// Función para detectar el portal desde la URL
function detectPortal(url: string | undefined): string {
  if (!url) return 'Octoparse';
  
  const portalMap: Record<string, string> = {
    'babilonia.pe': 'Babilonia',
    'urbania.pe': 'Urbania',
    'adondevivir.com': 'Adondevivir',
    'infocasas.com.pe': 'Infocasas',
    'properati.com.pe': 'Properati',
    'losportales.com.pe': 'Los Portales',
    'laencontre.com.pe': 'La Encontré',
    'mitula.pe': 'Mitula',
    'nexoinmobiliario.pe': 'Nexo Inmobiliario',
    'fazwaz.pe': 'FazWaz',
    'facebook.com': 'Facebook',
    'marketplace.facebook': 'Facebook',
    'mercadolibre.com.pe': 'Mercado Libre',
    'tiktok.com': 'TikTok',
    'remax.pe': 'RE/MAX',
  };
  
  for (const [domain, portal] of Object.entries(portalMap)) {
    if (url.includes(domain)) return portal;
  }
  
  return 'Octoparse';
}

// Función para detectar tipo de operación
function detectOperationType(data: OctoparseProperty): 'alquiler' | 'venta' {
  const text = `${data.titulo || ''} ${data.title || ''} ${data.tipo_operacion || ''} ${data.operationType || ''}`.toLowerCase();
  
  if (text.includes('alquiler') || text.includes('rent') || text.includes('arriendo')) {
    return 'alquiler';
  }
  return 'venta';
}

// Función para detectar tipo de propiedad
function detectPropertyType(data: OctoparseProperty): string {
  const text = `${data.titulo || ''} ${data.title || ''} ${data.tipo_propiedad || ''} ${data.propertyType || ''}`.toLowerCase();
  
  if (text.includes('casa')) return 'Casa';
  if (text.includes('terreno')) return 'Terreno';
  if (text.includes('local') || text.includes('comercial')) return 'Local Comercial';
  if (text.includes('oficina')) return 'Oficina';
  return 'Departamento';
}

// Función principal para importar datos de Octoparse
export async function importFromOctoparse(data: OctoparseProperty[]): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    imported: 0,
    errors: 0,
    duplicates: 0,
    errorMessages: [],
  };

  for (const row of data) {
    try {
      // Obtener URL de la propiedad
      const sourceUrl = row.url || row.sourceUrl || row.link || '';
      
      // Verificar si ya existe
      if (sourceUrl) {
        const existing = await db.getPropertyBySourceUrl(sourceUrl);
        if (existing) {
          result.duplicates++;
          continue;
        }
      }

      // Normalizar datos
      const { price, currency } = normalizePrice(row.precio || row.price);
      const portal = row.portal || row.source || detectPortal(sourceUrl);
      
      // Crear propiedad
      const property = {
        externalId: `octoparse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        portal,
        title: row.titulo || row.title || 'Sin título',
        description: row.descripcion || row.description || null,
        operationType: detectOperationType(row),
        propertyType: detectPropertyType(row),
        price: price.toString(),
        currency: row.moneda || row.currency || currency,
        area: row.area || row.area_m2 || null,
        bedrooms: normalizeNumber(row.dormitorios || row.bedrooms),
        bathrooms: normalizeNumber(row.banos || row.bathrooms),
        district: row.distrito || row.district || 'Lima',
        province: 'Lima',
        department: 'Lima',
        address: row.direccion || row.address || null,
        latitude: null,
        longitude: null,
        imageUrl: row.imagen || row.image || row.imageUrl || null,
        sourceUrl: sourceUrl || '',
        amenities: row.amenidades || row.amenities || null,
        ownerName: row.propietario || row.owner || row.agente || row.agent || null,
        ownerPhone: row.telefono || row.phone || null,
        ownerWhatsapp: row.whatsapp || row.telefono || row.phone || null,
        ownerEmail: row.email || null,
      };

      await db.upsertProperty(property);
      result.imported++;
    } catch (error) {
      result.errors++;
      result.errorMessages.push(`Error en fila: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  result.success = result.errors === 0;
  return result;
}

// Función para parsear CSV
export function parseCSV(csvContent: string): OctoparseProperty[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  // Obtener headers
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  const data: OctoparseProperty[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parsear valores (manejo básico de comillas)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    // Crear objeto
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (values[index]) {
        row[header] = values[index].replace(/^["']|["']$/g, '');
      }
    });
    
    data.push(row as OctoparseProperty);
  }
  
  return data;
}

// Plantilla de CSV para Octoparse
export const OCTOPARSE_CSV_TEMPLATE = `titulo,precio,direccion,distrito,dormitorios,banos,area,descripcion,url,imagen,telefono,whatsapp,email,propietario,tipo_operacion,tipo_propiedad,moneda,amenidades
"Departamento en Miraflores","$1,200","Av. Larco 123","Miraflores","2","2","80","Hermoso departamento...","https://babilonia.pe/inmueble/...","https://...","987654321","987654321","agente@email.com","Juan Pérez","alquiler","Departamento","USD","Piscina, Gimnasio"`;

// Campos esperados para la documentación
export const EXPECTED_FIELDS = [
  { name: 'titulo / title', description: 'Título del anuncio', required: true },
  { name: 'precio / price', description: 'Precio (ej: $1,200 o S/4,500)', required: true },
  { name: 'direccion / address', description: 'Dirección completa', required: false },
  { name: 'distrito / district', description: 'Distrito (ej: Miraflores)', required: true },
  { name: 'dormitorios / bedrooms', description: 'Número de dormitorios', required: false },
  { name: 'banos / bathrooms', description: 'Número de baños', required: false },
  { name: 'area / area_m2', description: 'Área en m²', required: false },
  { name: 'descripcion / description', description: 'Descripción del inmueble', required: false },
  { name: 'url / sourceUrl / link', description: 'URL del anuncio original', required: true },
  { name: 'imagen / image / imageUrl', description: 'URL de la imagen principal', required: false },
  { name: 'telefono / phone', description: 'Teléfono de contacto', required: false },
  { name: 'whatsapp', description: 'Número de WhatsApp', required: false },
  { name: 'email', description: 'Email de contacto', required: false },
  { name: 'propietario / owner / agente / agent', description: 'Nombre del propietario o agente', required: false },
  { name: 'tipo_operacion / operationType', description: 'alquiler o venta', required: false },
  { name: 'tipo_propiedad / propertyType', description: 'Departamento, Casa, etc.', required: false },
  { name: 'moneda / currency', description: 'USD o PEN', required: false },
  { name: 'amenidades / amenities', description: 'Lista de amenidades separadas por coma', required: false },
];
