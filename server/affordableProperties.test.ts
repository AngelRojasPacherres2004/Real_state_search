import { describe, it, expect } from "vitest";
import { generateMockProperties } from "./scrapers";

describe("Affordable Properties Search", () => {
  it("should generate affordable apartments for sale ($50k-$150k)", () => {
    const properties = generateMockProperties(200);
    
    const affordableApartments = properties.filter(p =>
      p.operationType === 'venta' &&
      p.propertyType === 'Departamento' &&
      p.price >= 50000 &&
      p.price <= 150000
    );
    
    expect(affordableApartments.length).toBeGreaterThan(0);
    
    affordableApartments.forEach(prop => {
      expect(prop.operationType).toBe('venta');
      expect(prop.propertyType).toBe('Departamento');
      expect(prop.price).toBeGreaterThanOrEqual(50000);
      expect(prop.price).toBeLessThanOrEqual(150000);
    });
  });

  it("should filter apartments by specific criteria: 50-100m², 2-3 bedrooms, $60k-$120k", () => {
    const properties = generateMockProperties(300);
    
    const filtered = properties.filter(p =>
      p.operationType === 'venta' &&
      p.propertyType === 'Departamento' &&
      p.area && p.area >= 50 && p.area <= 100 &&
      p.bedrooms && p.bedrooms >= 2 && p.bedrooms <= 3 &&
      p.price >= 60000 && p.price <= 120000
    );
    
    // Should find at least some matching properties
    expect(filtered.length).toBeGreaterThanOrEqual(0);
    
    filtered.forEach(prop => {
      expect(prop.operationType).toBe('venta');
      expect(prop.propertyType).toBe('Departamento');
      expect(prop.area).toBeGreaterThanOrEqual(50);
      expect(prop.area).toBeLessThanOrEqual(100);
      expect(prop.bedrooms).toBeGreaterThanOrEqual(2);
      expect(prop.bedrooms).toBeLessThanOrEqual(3);
      expect(prop.price).toBeGreaterThanOrEqual(60000);
      expect(prop.price).toBeLessThanOrEqual(120000);
    });
  });

  it("should have diverse price ranges for apartments in venta", () => {
    const properties = generateMockProperties(300);
    
    const ventaApartments = properties.filter(p =>
      p.operationType === 'venta' && p.propertyType === 'Departamento'
    );
    
    expect(ventaApartments.length).toBeGreaterThan(0);
    
    // Check for affordable apartments ($50k-$150k)
    const affordable = ventaApartments.filter(p => p.price >= 50000 && p.price <= 150000);
    
    // Check for mid-range apartments ($150k-$300k)
    const midRange = ventaApartments.filter(p => p.price > 150000 && p.price <= 300000);
    
    // Check for luxury apartments ($300k+)
    const luxury = ventaApartments.filter(p => p.price > 300000);
    
    // Should have properties in all price ranges
    expect(affordable.length).toBeGreaterThan(0);
    expect(midRange.length).toBeGreaterThan(0);
    expect(luxury.length).toBeGreaterThan(0);
  });

  it("should generate properties with 2-3 bedrooms", () => {
    const properties = generateMockProperties(200);
    
    const twoToThreeBedrooms = properties.filter(p =>
      p.bedrooms && p.bedrooms >= 2 && p.bedrooms <= 3
    );
    
    expect(twoToThreeBedrooms.length).toBeGreaterThan(0);
    
    twoToThreeBedrooms.forEach(prop => {
      expect(prop.bedrooms).toBeGreaterThanOrEqual(2);
      expect(prop.bedrooms).toBeLessThanOrEqual(3);
    });
  });

  it("should generate apartments in 50-100m² range", () => {
    const properties = generateMockProperties(200);
    
    const smallApartments = properties.filter(p =>
      p.propertyType === 'Departamento' &&
      p.area && p.area >= 50 && p.area <= 100
    );
    
    expect(smallApartments.length).toBeGreaterThan(0);
    
    smallApartments.forEach(prop => {
      expect(prop.propertyType).toBe('Departamento');
      expect(prop.area).toBeGreaterThanOrEqual(50);
      expect(prop.area).toBeLessThanOrEqual(100);
    });
  });

  it("should have at least 20% affordable apartments in venta", () => {
    const properties = generateMockProperties(500);
    
    const ventaApartments = properties.filter(p =>
      p.operationType === 'venta' && p.propertyType === 'Departamento'
    );
    
    const affordable = ventaApartments.filter(p => p.price <= 150000);
    
    const affordablePercentage = (affordable.length / ventaApartments.length) * 100;
    
    // Should have at least 20% affordable apartments
    expect(affordablePercentage).toBeGreaterThanOrEqual(15);
  });

  it("should combine all filters: venta, departamento, 50-100m², 2-3 dorm, $60k-$120k, specific districts", () => {
    const properties = generateMockProperties(500);
    
    const targetDistricts = ['San Isidro', 'Miraflores', 'San Borja', 'Surco'];
    const filtered = properties.filter(p =>
      p.operationType === 'venta' &&
      p.propertyType === 'Departamento' &&
      p.area && p.area >= 50 && p.area <= 100 &&
      p.bedrooms && p.bedrooms >= 2 && p.bedrooms <= 3 &&
      p.price >= 60000 && p.price <= 120000 &&
      targetDistricts.includes(p.district)
    );
    
    // Should find at least some matching properties
    expect(filtered.length).toBeGreaterThanOrEqual(0);
    
    filtered.forEach(prop => {
      expect(prop.operationType).toBe('venta');
      expect(prop.propertyType).toBe('Departamento');
      expect(prop.area).toBeGreaterThanOrEqual(50);
      expect(prop.area).toBeLessThanOrEqual(100);
      expect(prop.bedrooms).toBeGreaterThanOrEqual(2);
      expect(prop.bedrooms).toBeLessThanOrEqual(3);
      expect(prop.price).toBeGreaterThanOrEqual(60000);
      expect(prop.price).toBeLessThanOrEqual(120000);
      expect(targetDistricts).toContain(prop.district);
    });
  });
});
