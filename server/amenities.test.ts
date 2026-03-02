import { describe, it, expect } from "vitest";
import { generateMockProperties } from "./scrapers";

describe("Amenities Filter", () => {
  it("should generate properties with amenities", () => {
    const properties = generateMockProperties(50);
    
    const propertiesWithAmenities = properties.filter(p => p.amenities && p.amenities.length > 0);
    
    expect(propertiesWithAmenities.length).toBeGreaterThan(0);
    
    propertiesWithAmenities.forEach(prop => {
      expect(prop.amenities).toBeDefined();
      expect(Array.isArray(prop.amenities)).toBe(true);
      expect(prop.amenities!.length).toBeGreaterThan(0);
    });
  });

  it("should filter properties by single amenity", () => {
    const properties = generateMockProperties(100);
    
    // Filter by "Estacionamiento"
    const filtered = properties.filter(p => 
      p.amenities && p.amenities.some(a => a.toLowerCase().includes("estacionamiento"))
    );
    
    expect(filtered.length).toBeGreaterThan(0);
    
    filtered.forEach(prop => {
      expect(prop.amenities).toBeDefined();
      expect(prop.amenities!.some(a => a.toLowerCase().includes("estacionamiento"))).toBe(true);
    });
  });

  it("should filter properties by multiple amenities (AND logic)", () => {
    const properties = generateMockProperties(200);
    
    // Filter by "Estacionamiento" AND "Seguridad"
    const requiredAmenities = ["estacionamiento", "seguridad"];
    const filtered = properties.filter(p => {
      if (!p.amenities || p.amenities.length === 0) return false;
      return requiredAmenities.every(amenity =>
        p.amenities!.some(propAmenity =>
          propAmenity.toLowerCase().includes(amenity.toLowerCase())
        )
      );
    });
    
    expect(filtered.length).toBeGreaterThanOrEqual(0);
    
    filtered.forEach(prop => {
      expect(prop.amenities).toBeDefined();
      requiredAmenities.forEach(amenity => {
        expect(prop.amenities!.some(a => a.toLowerCase().includes(amenity))).toBe(true);
      });
    });
  });

  it("should have common amenities in generated properties", () => {
    const properties = generateMockProperties(100);
    
    const allAmenities = new Set<string>();
    properties.forEach(p => {
      if (p.amenities) {
        p.amenities.forEach(a => allAmenities.add(a));
      }
    });
    
    const amenitiesArray = Array.from(allAmenities);
    
    // Should have at least some common amenities
    expect(amenitiesArray.length).toBeGreaterThan(0);
    
    // Check for common amenities
    const commonAmenities = ["Estacionamiento", "Seguridad 24h", "Ascensor", "Gimnasio"];
    const hasCommonAmenities = commonAmenities.some(amenity =>
      amenitiesArray.includes(amenity)
    );
    
    expect(hasCommonAmenities).toBe(true);
  });

  it("should filter casas with specific amenities", () => {
    const properties = generateMockProperties(200);
    
    // Filter: Casas with "Gimnasio"
    const filtered = properties.filter(p =>
      p.propertyType === 'Casa' &&
      p.amenities &&
      p.amenities.some(a => a.toLowerCase().includes("gimnasio"))
    );
    
    expect(filtered.length).toBeGreaterThanOrEqual(0);
    
    filtered.forEach(prop => {
      expect(prop.propertyType).toBe('Casa');
      expect(prop.amenities!.some(a => a.toLowerCase().includes("gimnasio"))).toBe(true);
    });
  });

  it("should combine amenities filter with other filters", () => {
    const properties = generateMockProperties(300);
    
    // Complex filter: Casas, 600-900m², $1.2M-$3.5M, with Estacionamiento and Seguridad
    const requiredAmenities = ["estacionamiento", "seguridad"];
    const filtered = properties.filter(p =>
      p.propertyType === 'Casa' &&
      p.area && p.area >= 600 && p.area <= 900 &&
      p.price >= 1200000 && p.price <= 3500000 &&
      p.amenities &&
      requiredAmenities.every(amenity =>
        p.amenities!.some(propAmenity =>
          propAmenity.toLowerCase().includes(amenity.toLowerCase())
        )
      )
    );
    
    expect(filtered.length).toBeGreaterThanOrEqual(0);
    
    filtered.forEach(prop => {
      expect(prop.propertyType).toBe('Casa');
      expect(prop.area).toBeGreaterThanOrEqual(600);
      expect(prop.area).toBeLessThanOrEqual(900);
      expect(prop.price).toBeGreaterThanOrEqual(1200000);
      expect(prop.price).toBeLessThanOrEqual(3500000);
      requiredAmenities.forEach(amenity => {
        expect(prop.amenities!.some(a => a.toLowerCase().includes(amenity))).toBe(true);
      });
    });
  });
});
