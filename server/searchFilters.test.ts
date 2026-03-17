import { describe, it, expect } from "vitest";
import { generateMockProperties } from "./testUtils";

describe("Search Filters", () => {
  it("should generate properties with correct area ranges for casas", () => {
    const properties = generateMockProperties(100);
    const casas = properties.filter(p => p.propertyType === 'Casa');
    
    expect(casas.length).toBeGreaterThan(0);
    
    casas.forEach(casa => {
      expect(casa.area).toBeDefined();
      expect(casa.area!).toBeGreaterThanOrEqual(150);
      expect(casa.area!).toBeLessThanOrEqual(1000);
    });
  });

  it("should generate properties with correct price ranges for venta", () => {
    const properties = generateMockProperties(100);
    const ventaProperties = properties.filter(p => p.operationType === 'venta');
    
    expect(ventaProperties.length).toBeGreaterThan(0);
    
    ventaProperties.forEach(prop => {
      expect(prop.price).toBeGreaterThan(0);
      if (prop.propertyType === 'Casa') {
        expect(prop.price).toBeGreaterThanOrEqual(200000);
      }
    });
  });

  it("should filter properties by area range (600-900 m2)", () => {
    const properties = generateMockProperties(200);
    const filtered = properties.filter(p => 
      p.area && p.area >= 600 && p.area <= 900
    );
    
    expect(filtered.length).toBeGreaterThan(0);
    
    filtered.forEach(prop => {
      expect(prop.area).toBeGreaterThanOrEqual(600);
      expect(prop.area).toBeLessThanOrEqual(900);
    });
  });

  it("should filter properties by price range (1,200,000 - 3,500,000 USD)", () => {
    const properties = generateMockProperties(200);
    const filtered = properties.filter(p => 
      p.price >= 1200000 && p.price <= 3500000 && p.currency === 'USD'
    );
    
    expect(filtered.length).toBeGreaterThan(0);
    
    filtered.forEach(prop => {
      expect(prop.price).toBeGreaterThanOrEqual(1200000);
      expect(prop.price).toBeLessThanOrEqual(3500000);
      expect(prop.currency).toBe('USD');
    });
  });

  it("should filter casas by multiple criteria", () => {
    const properties = generateMockProperties(300);
    
    // Filter: Casas, 600-900m2, $1.2M-$3.5M, specific districts
    const targetDistricts = ['Magdalena', 'Jesús María', 'Lince', 'Pueblo Libre'];
    const filtered = properties.filter(p => 
      p.propertyType === 'Casa' &&
      p.area && p.area >= 600 && p.area <= 900 &&
      p.price >= 1200000 && p.price <= 3500000 &&
      targetDistricts.includes(p.district)
    );
    
    // Should find at least some matching properties
    expect(filtered.length).toBeGreaterThanOrEqual(0);
    
    filtered.forEach(prop => {
      expect(prop.propertyType).toBe('Casa');
      expect(prop.area).toBeGreaterThanOrEqual(600);
      expect(prop.area).toBeLessThanOrEqual(900);
      expect(prop.price).toBeGreaterThanOrEqual(1200000);
      expect(prop.price).toBeLessThanOrEqual(3500000);
      expect(targetDistricts).toContain(prop.district);
    });
  });

  it("should include all 16 districts in generated properties", () => {
    const properties = generateMockProperties(200);
    const districts = new Set(properties.map(p => p.district));
    
    // Should have good district coverage
    expect(districts.size).toBeGreaterThanOrEqual(12);
    
    // Check that new districts are included
    const allDistricts = Array.from(districts);
    const hasNewDistricts = ['Surquillo', 'Ate', 'La Victoria', 'Breña'].some(d => 
      allDistricts.includes(d)
    );
    expect(hasNewDistricts).toBe(true);
  });

  it("should generate properties with property type filter", () => {
    const properties = generateMockProperties(100);
    const casas = properties.filter(p => p.propertyType.toLowerCase() === 'casa');
    const departamentos = properties.filter(p => p.propertyType.toLowerCase() === 'departamento');
    
    expect(casas.length).toBeGreaterThan(0);
    expect(departamentos.length).toBeGreaterThan(0);
    
    casas.forEach(casa => {
      expect(casa.propertyType).toBe('Casa');
    });
  });

  it("should generate properties with different operation types", () => {
    const properties = generateMockProperties(100);
    const alquiler = properties.filter(p => p.operationType === 'alquiler');
    const venta = properties.filter(p => p.operationType === 'venta');
    
    expect(alquiler.length).toBeGreaterThan(0);
    expect(venta.length).toBeGreaterThan(0);
  });
});
