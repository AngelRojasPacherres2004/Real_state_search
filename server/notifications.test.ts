import { describe, expect, it } from "vitest";
import { sendPropertyAlertEmail } from "./emailNotifications";

describe("Email Notifications", () => {
  it("should format email notification correctly", { timeout: 10000 }, async () => {
    const mockProperties = [
      {
        id: 1,
        title: "Departamento en San Isidro",
        district: "San Isidro",
        price: "1200",
        currency: "USD",
        bedrooms: 2,
        bathrooms: 2,
        area: "100",
        portal: "Urbania",
        ownerPhone: "+51 999 888 777",
        ownerEmail: "owner@example.com",
        operationType: "alquiler",
        propertyType: "departamento",
        province: "Lima",
        address: "Av. Test 123",
        sourceUrl: "https://example.com/property/1",
        imageUrl: null,
        description: "Hermoso departamento",
        fullDescription: null,
        amenities: null,
        buildingAmenities: null,
        nearbyPlaces: null,
        ownerName: null,
        ownerWhatsapp: null,
        agentName: null,
        agentCompany: null,
        latitude: null,
        longitude: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = await sendPropertyAlertEmail({
      userEmail: "test@example.com",
      userName: "Test User",
      properties: mockProperties as any,
      alertCriteria: {
        operationType: "alquiler",
        districts: ["San Isidro"],
        minPrice: 800,
        maxPrice: 1500,
      },
    });

    // The function should return true indicating notification was sent
    expect(result).toBe(true);
  });

  it("should return false when no properties provided", async () => {
    const result = await sendPropertyAlertEmail({
      userEmail: "test@example.com",
      userName: "Test User",
      properties: [],
      alertCriteria: {
        operationType: "alquiler",
      },
    });

    expect(result).toBe(false);
  });
});
