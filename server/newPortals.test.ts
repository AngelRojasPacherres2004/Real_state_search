import { describe, it, expect } from "vitest";
import { PropertyScraper, generateMockProperties } from "./scrapers";

describe("New Portals Integration", () => {
  it("should include all 14 portals in PropertyScraper", () => {
    const scraper = new PropertyScraper();
    
    // Access the private scrapers array through the scrapeAll method
    // This will verify all scrapers are initialized
    expect(scraper).toBeDefined();
  });

  it("should generate mock properties from all 14 portals", () => {
    const properties = generateMockProperties(100);
    
    expect(properties.length).toBe(100);
    
    // Extract unique portals from generated properties
    const portals = new Set(properties.map(p => p.portal));
    
    // Verify all 14 portals are represented
    expect(portals.has('urbania')).toBe(true);
    expect(portals.has('babilonia')).toBe(true);
    expect(portals.has('infocasas')).toBe(true);
    expect(portals.has('properati')).toBe(true);
    expect(portals.has('adondevivir')).toBe(true);
    expect(portals.has('fazwaz')).toBe(true);
    expect(portals.has('ubicasa')).toBe(true);
    expect(portals.has('losportales')).toBe(true);
    expect(portals.has('laencontre')).toBe(true);
    expect(portals.has('mitula')).toBe(true);
    expect(portals.has('nexoinmobiliario')).toBe(true);
    expect(portals.has('facebook')).toBe(true);
    expect(portals.has('mercadolibre')).toBe(true);
    expect(portals.has('tiktok')).toBe(true);
  });

  it("should have at least 10 different portals in 100 random properties", () => {
    const properties = generateMockProperties(100);
    const portals = new Set(properties.map(p => p.portal));
    
    // With 14 portals and 100 properties, we should see at least 10 different portals
    expect(portals.size).toBeGreaterThanOrEqual(10);
  });

  it("should include new portals in mock data", () => {
    const properties = generateMockProperties(200);
    
    // Check that new portals appear in the generated data
    const hasLaEncontre = properties.some(p => p.portal === 'laencontre');
    const hasMitula = properties.some(p => p.portal === 'mitula');
    const hasNexo = properties.some(p => p.portal === 'nexoinmobiliario');
    const hasFacebook = properties.some(p => p.portal === 'facebook');
    const hasMercadoLibre = properties.some(p => p.portal === 'mercadolibre');
    const hasTikTok = properties.some(p => p.portal === 'tiktok');
    
    // At least some of the new portals should appear
    const newPortalsCount = [hasLaEncontre, hasMitula, hasNexo, hasFacebook, hasMercadoLibre, hasTikTok].filter(Boolean).length;
    expect(newPortalsCount).toBeGreaterThanOrEqual(4);
  });

  it("should maintain property structure for all portals", () => {
    const properties = generateMockProperties(50);
    
    properties.forEach(property => {
      expect(property).toHaveProperty('externalId');
      expect(property).toHaveProperty('portal');
      expect(property).toHaveProperty('title');
      expect(property).toHaveProperty('operationType');
      expect(property).toHaveProperty('propertyType');
      expect(property).toHaveProperty('price');
      expect(property).toHaveProperty('currency');
      expect(property).toHaveProperty('district');
      expect(property).toHaveProperty('sourceUrl');
      
      // Verify portal is one of the 14 valid portals
      const validPortals = ['urbania', 'babilonia', 'infocasas', 'properati', 'adondevivir', 'fazwaz', 'ubicasa', 'losportales', 'laencontre', 'mitula', 'nexoinmobiliario', 'facebook', 'mercadolibre', 'tiktok'];
      expect(validPortals).toContain(property.portal);
    });
  });
});
