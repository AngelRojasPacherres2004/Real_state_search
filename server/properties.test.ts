import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("properties.search", () => {
  it("should return properties based on search criteria", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.properties.search({
      operationType: "alquiler",
      minPrice: 800,
      maxPrice: 2000,
    });

    expect(result).toBeDefined();
    expect(result.properties).toBeInstanceOf(Array);
    expect(result.source).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it("should filter properties by district", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.properties.search({
      operationType: "alquiler",
      districts: ["San Isidro"],
    });

    expect(result).toBeDefined();
    expect(result.properties).toBeInstanceOf(Array);
    
    // If there are results, verify they match the district filter
    if (result.properties.length > 0) {
      result.properties.forEach((property: any) => {
        expect(property.district).toBe("San Isidro");
      });
    }
  });

  it("should filter properties by bedroom count", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.properties.search({
      operationType: "alquiler",
      minBedrooms: 2,
      maxBedrooms: 3,
    });

    expect(result).toBeDefined();
    expect(result.properties).toBeInstanceOf(Array);
    
    // If there are results, verify they match the bedroom filter
    if (result.properties.length > 0) {
      result.properties.forEach((property: any) => {
        if (property.bedrooms !== null) {
          expect(property.bedrooms).toBeGreaterThanOrEqual(2);
          expect(property.bedrooms).toBeLessThanOrEqual(3);
        }
      });
    }
  });
});

describe("favorites", () => {
  it("should add a property to favorites", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First, get a property to favorite
    const searchResult = await caller.properties.search({
      operationType: "alquiler",
      limit: 1,
    });

    if (searchResult.properties.length > 0) {
      const propertyId = searchResult.properties[0].id;

      const result = await caller.favorites.add({
        propertyId,
        notes: "Test favorite",
      });

      expect(result.success).toBe(true);
    }
  });

  it("should list user favorites", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.favorites.list();

    expect(result).toBeInstanceOf(Array);
  });
});

describe("alerts", () => {
  it("should create an alert", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.alerts.create({
      name: "Test Alert",
      operationType: "alquiler",
      districts: ["San Isidro"],
      minPrice: 800,
      maxPrice: 2000,
    });

    expect(result.success).toBe(true);
    expect(result.alertId).toBeDefined();
  });

  it("should list user alerts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.alerts.list();

    expect(result).toBeInstanceOf(Array);
  });

  it("should update alert status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an alert first
    const createResult = await caller.alerts.create({
      name: "Test Alert for Update",
      operationType: "venta",
    });

    // Update the alert
    const updateResult = await caller.alerts.update({
      id: createResult.alertId,
      isActive: false,
    });

    expect(updateResult.success).toBe(true);
  });
});

describe("leads", () => {
  it("should create a lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.create({
      name: "Juan Pérez",
      email: "juan@example.com",
      phone: "+51 999 999 999",
      interestedIn: "Departamento en San Isidro",
    });

    expect(result.success).toBe(true);
    expect(result.leadId).toBeDefined();
  });

  it("should list user leads", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.list();

    expect(result).toBeInstanceOf(Array);
  });

  it("should update lead status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lead first
    const createResult = await caller.leads.create({
      name: "Test Lead",
      email: "test@example.com",
    });

    // Update the lead status
    const updateResult = await caller.leads.update({
      id: createResult.leadId,
      status: "contactado",
    });

    expect(updateResult.success).toBe(true);
  });
});

describe("analytics", () => {
  it("should return statistics by district", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.statsByDistrict({
      operationType: "alquiler",
    });

    expect(result).toBeInstanceOf(Array);
  });

  it("should return statistics by portal", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.statsByPortal({
      operationType: "venta",
    });

    expect(result).toBeInstanceOf(Array);
  });
});
