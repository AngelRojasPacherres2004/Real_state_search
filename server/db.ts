import { eq, and, gte, lte, inArray, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  properties, InsertProperty, Property,
  priceHistory, InsertPriceHistory,
  favorites, InsertFavorite,
  alerts, InsertAlert, Alert,
  alertNotifications, InsertAlertNotification,
  leads, InsertLead, Lead,
  savedSearches, InsertSavedSearch,
  searchHistory, InsertSearchHistory,
  searchCache, InsertSearchCache
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ========== USER FUNCTIONS ==========

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const now = new Date();
    const role = user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user');

    await db.insert(users).values({
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role,
      lastSignedIn: user.lastSignedIn ?? now,
    }).onDuplicateKeyUpdate({
      set: {
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role,
        lastSignedIn: user.lastSignedIn ?? now,
      },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function createUser(userData: { email: string; name?: string; role?: 'user' | 'admin' }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate a temporary openId for invited users
  const tempOpenId = `invited_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const result = await db.insert(users).values({
    openId: tempOpenId,
    email: userData.email,
    name: userData.name || null,
    role: userData.role || 'user',
  });
  
  return Number(result[0].insertId);
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, userId));
}

export async function updateUserRole(userId: number, role: 'user' | 'admin') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ========== PROPERTY FUNCTIONS ==========

export async function insertProperty(property: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(properties).values(property);
  return result;
}

export async function upsertProperty(property: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if property exists by portal + externalId
  const existing = await db
    .select()
    .from(properties)
    .where(
      and(
        eq(properties.portal, property.portal),
        eq(properties.externalId, property.externalId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing property
    const existingProperty = existing[0];
    
    // Track price change
    if (existingProperty && property.price && existingProperty.price !== property.price.toString()) {
      await insertPriceHistory({
        propertyId: existingProperty.id,
        price: property.price,
        currency: property.currency || 'USD',
      });
    }

    await db
      .update(properties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(properties.id, existingProperty.id));
    
    return existingProperty.id;
  } else {
    // Insert new property
    const result = await db.insert(properties).values(property);
    return result[0]?.insertId;
  }
}

// Tasa de cambio aproximada USD a PEN
const USD_TO_PEN_RATE = 3.75;

function parseNumberFromPrice(priceRaw: string | null | undefined) {
  if (!priceRaw) return null;
  const normalized = priceRaw
    .replace(/S\//g, '')
    .replace(/\$/g, '')
    .replace(/USD/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .match(/\d+(?:[\.,]\d+)?/g)?.[0];
  if (!normalized) return null;
  const value = Number(normalized.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

function parseOperationTypeFromPrice(priceRaw: string | null | undefined) {
  if (!priceRaw) return 'alquiler';
  if (/\b(venta|comprar|compras?)\b/i.test(priceRaw)) return 'venta';
  return 'alquiler';
}

function mapDepartamentoRow(row: any) {
  const precio = row.precio || '';
  const parsedPrice = parseNumberFromPrice(precio);
  const currency = precio.includes('USD') ? 'USD' : 'PEN';

  const caracteristicas = row.caracteristicas || '';
  const areaMatch = caracteristicas.match(/(\d+(?:[\.,]\d+)?)\s*m/);
  const bedroomsMatch = caracteristicas.match(/(\d+)\s*dorm/i);
  const bathroomsMatch = caracteristicas.match(/(\d+)\s*baño/i);

  return {
    id: row.id,
    externalId: row.id_listing || `${row.portal || 'departamentos'}-${row.id}`,
    portal: row.portal || 'departamentos',
    title: row.caracteristicas || row.ubicacion || 'Departamento',
    description: row.caracteristicas || '',
    operationType: parseOperationTypeFromPrice(precio),
    propertyType: 'departamento',
    price: parsedPrice ?? 0,
    currency,
    area: areaMatch ? Number(areaMatch[1].replace(',', '.')) : null,
    bedrooms: bedroomsMatch ? Number(bedroomsMatch[1]) : null,
    bathrooms: bathroomsMatch ? Number(bathroomsMatch[1]) : null,
    district: row.ubicacion || null,
    province: row.ubicacion || null,
    department: null,
    address: row.ubicacion || null,
    latitude: null,
    longitude: null,
    imageUrl: row.foto || null,
    sourceUrl: row.link || null,
    amenities: null,
    fullDescription: row.caracteristicas || null,
    buildingAmenities: null,
    nearbyPlaces: null,
    ownerName: null,
    ownerPhone: null,
    ownerEmail: null,
    ownerWhatsapp: null,
    agentName: null,
    agentCompany: null,
    isActive: true,
    publishedAt: row.ultima_vez_visto || null,
    scrapedAt: row.created_at || new Date(),
    createdAt: row.created_at || new Date(),
    updatedAt: row.created_at || new Date(),
  };
}

export async function searchProperties(filters: {
  operationType?: 'alquiler' | 'venta';
  propertyType?: string;
  districts?: string[];
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  minArea?: number;
  maxArea?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  portals?: string[];
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // 1) Search in departamentos first (for your custom table)
  try {
    const conditions = ['1=1'];

    if (filters.operationType) {
      const op = filters.operationType === 'venta' ? 'venta' : 'alquiler';
      conditions.push(`operacion = '${op}'`);
    }

    if (filters.districts && filters.districts.length > 0) {
      const districtConds = filters.districts.map(d => {
        const escaped = d.replace(/'/g, "''").toLowerCase();
        return `LOWER(ubicacion) LIKE '%${escaped}%'`;
      });
      conditions.push(`(${districtConds.join(' OR ')})`);
    }

    if (filters.minPrice !== undefined) {
      const minP = Number(filters.minPrice);
      if (!Number.isNaN(minP)) {
        conditions.push(`CAST(REPLACE(REPLACE(REPLACE(REPLACE(precio, 'S/', ''), '$', ''), 'USD', ''), ',', '.') AS DECIMAL(15,2)) >= ${minP}`);
      }
    }
    if (filters.maxPrice !== undefined) {
      const maxP = Number(filters.maxPrice);
      if (!Number.isNaN(maxP)) {
        conditions.push(`CAST(REPLACE(REPLACE(REPLACE(REPLACE(precio, 'S/', ''), '$', ''), 'USD', ''), ',', '.') AS DECIMAL(15,2)) <= ${maxP}`);
      }
    }

    if (filters.minArea !== undefined) {
      const minA = Number(filters.minArea);
      if (!Number.isNaN(minA)) {
        conditions.push(`caracteristicas LIKE '%${minA} m%'`);
      }
    }

    const limit = Number.isFinite(Number(filters.limit)) && Number(filters.limit) > 0 ? Number(filters.limit) : 50;
    const offset = Number.isFinite(Number(filters.offset)) && Number(filters.offset) >= 0 ? Number(filters.offset) : 0;
    const sqlString = `SELECT * FROM departamentos WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    console.log('[DB] departamentos SQL', sqlString);
    const result: any = await (db as any).execute(sqlString);
    const rows = result[0] ?? result;
    console.log('[DB] departamentos rows', Array.isArray(rows) ? rows.length : 0);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map(mapDepartamentoRow);
    }
  } catch (error) {
    console.warn('[DB] departamentos fallback search failed', error);
  }

  // 2) Fallback to default properties table if nothing found or no departamentos rows
  const conditions = [eq(properties.isActive, true)];

  if (filters.operationType) {
    conditions.push(eq(properties.operationType, filters.operationType));
  }

  if (filters.propertyType) {
    const propType = filters.propertyType.toLowerCase();
    conditions.push(sql`LOWER(${properties.propertyType}) LIKE ${`%${propType}%`}`);
  }

  if (filters.districts && filters.districts.length > 0) {
    const districtConditions = filters.districts.map(d => 
      sql`LOWER(${properties.district}) LIKE ${`%${d.toLowerCase()}%`}`
    );
    conditions.push(sql`(${sql.join(districtConditions, sql` OR `)})`);
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const searchCurrency = filters.currency || 'USD';
    if (searchCurrency === 'PEN') {
      if (filters.minPrice !== undefined) {
        conditions.push(sql`(
          (${properties.currency} = 'PEN' AND CAST(${properties.price} AS DECIMAL(15,2)) >= ${filters.minPrice})
          OR
          (${properties.currency} = 'USD' AND CAST(${properties.price} AS DECIMAL(15,2)) * ${USD_TO_PEN_RATE} >= ${filters.minPrice})
        )`);
      }
      if (filters.maxPrice !== undefined) {
        conditions.push(sql`(
          (${properties.currency} = 'PEN' AND CAST(${properties.price} AS DECIMAL(15,2)) <= ${filters.maxPrice})
          OR
          (${properties.currency} = 'USD' AND CAST(${properties.price} AS DECIMAL(15,2)) * ${USD_TO_PEN_RATE} <= ${filters.maxPrice})
        )`);
      }
    } else {
      if (filters.minPrice !== undefined) {
        conditions.push(sql`(
          (${properties.currency} = 'USD' AND CAST(${properties.price} AS DECIMAL(15,2)) >= ${filters.minPrice})
          OR
          (${properties.currency} = 'PEN' AND CAST(${properties.price} AS DECIMAL(15,2)) / ${USD_TO_PEN_RATE} >= ${filters.minPrice})
        )`);
      }
      if (filters.maxPrice !== undefined) {
        conditions.push(sql`(
          (${properties.currency} = 'USD' AND CAST(${properties.price} AS DECIMAL(15,2)) <= ${filters.maxPrice})
          OR
          (${properties.currency} = 'PEN' AND CAST(${properties.price} AS DECIMAL(15,2)) / ${USD_TO_PEN_RATE} <= ${filters.maxPrice})
        )`);
      }
    }
  }

  if (filters.minArea !== undefined) {
    conditions.push(sql`CAST(${properties.area} AS DECIMAL(10,2)) >= ${filters.minArea}`);
  }
  if (filters.maxArea !== undefined) {
    conditions.push(sql`CAST(${properties.area} AS DECIMAL(10,2)) <= ${filters.maxArea}`);
  }

  if (filters.minBedrooms !== undefined) {
    conditions.push(gte(properties.bedrooms, filters.minBedrooms));
  }
  if (filters.maxBedrooms !== undefined) {
    conditions.push(lte(properties.bedrooms, filters.maxBedrooms));
  }

  if (filters.minBathrooms !== undefined) {
    conditions.push(gte(properties.bathrooms, filters.minBathrooms));
  }
  if (filters.maxBathrooms !== undefined) {
    conditions.push(lte(properties.bathrooms, filters.maxBathrooms));
  }

  if (filters.portals && filters.portals.length > 0) {
    conditions.push(inArray(properties.portal, filters.portals));
  }

  const query = db
    .select()
    .from(properties)
    .where(and(...conditions))
    .orderBy(desc(properties.createdAt))
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);

  return await query;
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result[0];
}

export async function getPropertyBySourceUrl(sourceUrl: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(properties).where(eq(properties.sourceUrl, sourceUrl)).limit(1);
  return result[0] || null;
}

// ========== PRICE HISTORY FUNCTIONS ==========

export async function insertPriceHistory(priceRecord: InsertPriceHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(priceHistory).values(priceRecord);
}

export async function getPriceHistory(propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(priceHistory)
    .where(eq(priceHistory.propertyId, propertyId))
    .orderBy(desc(priceHistory.recordedAt));
}

// ========== FAVORITES FUNCTIONS ==========

export async function addFavorite(favorite: InsertFavorite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(favorites).values(favorite);
}

export async function removeFavorite(userId: number, propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
}

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      favorite: favorites,
      property: properties,
    })
    .from(favorites)
    .innerJoin(properties, eq(favorites.propertyId, properties.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}

export async function isFavorite(userId: number, propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)))
    .limit(1);

  return result.length > 0;
}

// ========== ALERTS FUNCTIONS ==========

export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(alerts).values(alert);
  return result[0]?.insertId;
}

export async function getUserAlerts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt));
}

export async function updateAlert(alertId: number, updates: Partial<Alert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(alerts).set(updates).where(eq(alerts.id, alertId));
}

export async function deleteAlert(alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(alerts).where(eq(alerts.id, alertId));
}

export async function getActiveAlerts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(alerts).where(eq(alerts.isActive, true));
}

// ========== ALERT NOTIFICATIONS FUNCTIONS ==========

export async function recordAlertNotification(notification: InsertAlertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(alertNotifications).values(notification);
}

export async function wasPropertyNotified(alertId: number, propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(alertNotifications)
    .where(
      and(
        eq(alertNotifications.alertId, alertId),
        eq(alertNotifications.propertyId, propertyId)
      )
    )
    .limit(1);

  return result.length > 0;
}

// ========== LEADS FUNCTIONS ==========

export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leads).values(lead);
  return result[0]?.insertId;
}

export async function getUserLeads(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      lead: leads,
      property: properties,
    })
    .from(leads)
    .leftJoin(properties, eq(leads.propertyId, properties.id))
    .where(eq(leads.userId, userId))
    .orderBy(desc(leads.createdAt));
}

export async function updateLead(leadId: number, updates: Partial<Lead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(leads).set(updates).where(eq(leads.id, leadId));
}

export async function deleteLead(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(leads).where(eq(leads.id, leadId));
}

// ========== SEARCH CACHE FUNCTIONS ==========

export async function getCachedSearch(cacheKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(searchCache)
    .where(
      and(
        eq(searchCache.cacheKey, cacheKey),
        gte(searchCache.expiresAt, new Date())
      )
    )
    .limit(1);

  return result[0];
}

export async function setCachedSearch(cache: InsertSearchCache) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(searchCache).values(cache);
}

export async function clearExpiredCache() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(searchCache).where(lte(searchCache.expiresAt, new Date()));
}

// ========== ANALYTICS FUNCTIONS ==========

export async function getPropertyStatsByDistrict(operationType?: 'alquiler' | 'venta') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(properties.isActive, true)];
  if (operationType) {
    conditions.push(eq(properties.operationType, operationType));
  }

  const stats = await db
    .select({
      district: properties.district,
      count: sql<number>`count(*)`,
      avgPrice: sql<number>`avg(${properties.price})`,
      minPrice: sql<number>`min(${properties.price})`,
      maxPrice: sql<number>`max(${properties.price})`,
    })
    .from(properties)
    .where(and(...conditions))
    .groupBy(properties.district);

  return stats;
}

export async function getPropertyStatsByPortal(operationType?: 'alquiler' | 'venta') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(properties.isActive, true)];
  if (operationType) {
    conditions.push(eq(properties.operationType, operationType));
  }

  const stats = await db
    .select({
      portal: properties.portal,
      count: sql<number>`count(*)`,
      avgPrice: sql<number>`avg(${properties.price})`,
    })
    .from(properties)
    .where(and(...conditions))
    .groupBy(properties.portal);

  return stats;
}

// Saved Searches functions
export async function createSavedSearch(data: InsertSavedSearch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(savedSearches).values(data);
  return result;
}

export async function getUserSavedSearches(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(savedSearches).where(eq(savedSearches.userId, userId));
}

export async function deleteSavedSearch(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(savedSearches).where(
    and(eq(savedSearches.id, id), eq(savedSearches.userId, userId))
  );
}

// Search History functions
export async function createSearchHistory(data: InsertSearchHistory) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(searchHistory).values(data);
}

export async function getUserSearchHistory(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.searchedAt))
    .limit(limit);
}

export async function updateFavoriteNotes(userId: number, propertyId: number, notes: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(favorites)
    .set({ notes })
    .where(
      and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId))
    );
}


export async function deleteSearchHistory(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(searchHistory).where(and(eq(searchHistory.id, id), eq(searchHistory.userId, userId)));
}
