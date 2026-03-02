import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Saved searches table - stores user's saved search criteria
 */
export const savedSearches = mysqlTable("savedSearches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  operationType: mysqlEnum("operationType", ["alquiler", "venta"]).notNull(),
  propertyType: varchar("propertyType", { length: 50 }),
  districts: text("districts"), // JSON array of districts
  portals: text("portals"), // JSON array of portal IDs
  minPrice: varchar("minPrice", { length: 20 }),
  maxPrice: varchar("maxPrice", { length: 20 }),
  minBedrooms: varchar("minBedrooms", { length: 10 }),
  maxBedrooms: varchar("maxBedrooms", { length: 10 }),
  minArea: varchar("minArea", { length: 20 }),
  maxArea: varchar("maxArea", { length: 20 }),
  publishedWithin: varchar("publishedWithin", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = typeof savedSearches.$inferInsert;

/**
 * Search history table - tracks user's search activity
 */
export const searchHistory = mysqlTable("searchHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  operationType: mysqlEnum("operationType", ["alquiler", "venta"]).notNull(),
  propertyType: varchar("propertyType", { length: 50 }),
  districts: text("districts"), // JSON array of districts
  portals: text("portals"), // JSON array of portal IDs
  minPrice: varchar("minPrice", { length: 20 }),
  maxPrice: varchar("maxPrice", { length: 20 }),
  minBedrooms: varchar("minBedrooms", { length: 10 }),
  maxBedrooms: varchar("maxBedrooms", { length: 10 }),
  minArea: varchar("minArea", { length: 20 }),
  maxArea: varchar("maxArea", { length: 20 }),
  publishedWithin: varchar("publishedWithin", { length: 20 }),
  resultsCount: int("resultsCount").default(0),
  searchedAt: timestamp("searchedAt").defaultNow().notNull(),
});

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;

/**
 * Properties table - stores scraped property data from multiple portals
 */
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 255 }).notNull(), // ID from the source portal
  portal: varchar("portal", { length: 50 }).notNull(), // urbania, adondevivir, infocasas, etc.
  title: text("title").notNull(),
  description: text("description"),
  operationType: mysqlEnum("operationType", ["alquiler", "venta"]).notNull(),
  propertyType: varchar("propertyType", { length: 50 }).notNull(), // departamento, casa, oficina, etc.
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  area: decimal("area", { precision: 10, scale: 2 }), // m²
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  district: varchar("district", { length: 100 }),
  province: varchar("province", { length: 100 }),
  department: varchar("department", { length: 100 }),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  imageUrl: text("imageUrl"),
  sourceUrl: text("sourceUrl").notNull(), // Link to original listing
  amenities: text("amenities"), // JSON string of amenities
  fullDescription: text("fullDescription"),
  buildingAmenities: text("buildingAmenities"),
  nearbyPlaces: text("nearbyPlaces"),
  // Contact information
  ownerName: varchar("ownerName", { length: 255 }),
  ownerPhone: varchar("ownerPhone", { length: 50 }),
  ownerEmail: varchar("ownerEmail", { length: 255 }),
  ownerWhatsapp: varchar("ownerWhatsapp", { length: 50 }),
  agentName: varchar("agentName", { length: 255 }),
  agentCompany: varchar("agentCompany", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  publishedAt: timestamp("publishedAt"),
  scrapedAt: timestamp("scrapedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  portalExternalIdIdx: index("portal_external_id_idx").on(table.portal, table.externalId),
  districtIdx: index("district_idx").on(table.district),
  operationTypeIdx: index("operation_type_idx").on(table.operationType),
  priceIdx: index("price_idx").on(table.price),
}));

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Price history table - tracks price changes over time
 */
export const priceHistory = mysqlTable("priceHistory", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().references(() => properties.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index("property_id_idx").on(table.propertyId),
}));

export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;

/**
 * Favorites table - users can save properties
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: int("propertyId").notNull().references(() => properties.id, { onDelete: "cascade" }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userPropertyIdx: index("user_property_idx").on(table.userId, table.propertyId),
}));

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Alerts table - users can create alerts for specific search criteria
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  operationType: mysqlEnum("operationType", ["alquiler", "venta"]),
  propertyType: varchar("propertyType", { length: 50 }),
  districts: text("districts"), // JSON array of districts
  minPrice: decimal("minPrice", { precision: 12, scale: 2 }),
  maxPrice: decimal("maxPrice", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  minArea: decimal("minArea", { precision: 10, scale: 2 }),
  maxArea: decimal("maxArea", { precision: 10, scale: 2 }),
  minBedrooms: int("minBedrooms"),
  maxBedrooms: int("maxBedrooms"),
  minBathrooms: int("minBathrooms"),
  maxBathrooms: int("maxBathrooms"),
  amenities: text("amenities"), // JSON array of required amenities
  isActive: boolean("isActive").default(true).notNull(),
  lastChecked: timestamp("lastChecked"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Alert notifications table - tracks which properties have been sent as alerts
 */
export const alertNotifications = mysqlTable("alertNotifications", {
  id: int("id").autoincrement().primaryKey(),
  alertId: int("alertId").notNull().references(() => alerts.id, { onDelete: "cascade" }),
  propertyId: int("propertyId").notNull().references(() => properties.id, { onDelete: "cascade" }),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
}, (table) => ({
  alertPropertyIdx: index("alert_property_idx").on(table.alertId, table.propertyId),
}));

export type AlertNotification = typeof alertNotifications.$inferSelect;
export type InsertAlertNotification = typeof alertNotifications.$inferInsert;

/**
 * Leads table - captures potential client information
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  propertyId: int("propertyId").references(() => properties.id, { onDelete: "set null" }),
  interestedIn: text("interestedIn"), // Description of what they're looking for
  status: mysqlEnum("status", ["nuevo", "contactado", "calificado", "convertido", "descartado"]).default("nuevo").notNull(),
  notes: text("notes"),
  source: varchar("source", { length: 100 }), // Where the lead came from
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Search cache table - caches search results to improve performance
 */
export const searchCache = mysqlTable("searchCache", {
  id: int("id").autoincrement().primaryKey(),
  cacheKey: varchar("cacheKey", { length: 255 }).notNull().unique(),
  portal: varchar("portal", { length: 50 }).notNull(),
  results: text("results").notNull(), // JSON string of search results
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  cacheKeyIdx: index("cache_key_idx").on(table.cacheKey),
  expiresAtIdx: index("expires_at_idx").on(table.expiresAt),
}));

export type SearchCache = typeof searchCache.$inferSelect;
export type InsertSearchCache = typeof searchCache.$inferInsert;
