import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Property Type Filter", () => {
  it("should accept propertyType in search query", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.properties.search({
      operationType: "venta",
      propertyType: "departamento",
      districts: ["San Isidro"],
      minPrice: 100000,
      maxPrice: 500000,
    });

    expect(result).toBeDefined();
    expect(result.properties).toBeDefined();
    expect(Array.isArray(result.properties)).toBe(true);
  });

  it("should accept propertyType in saved search", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.savedSearches.create({
      name: "Departamentos en San Isidro",
      operationType: "venta",
      propertyType: "departamento",
      districts: ["San Isidro"],
      minPrice: "100000",
      maxPrice: "500000",
    });

    expect(result).toEqual({ success: true });
  });

  it("should accept propertyType in search history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.searchHistory.record({
      operationType: "alquiler",
      propertyType: "casa",
      districts: ["Miraflores"],
      minPrice: "1000",
      maxPrice: "2000",
      resultsCount: 10,
    });

    expect(result).toEqual({ success: true });
  });

  it("should accept propertyType in export", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.export.properties({
      operationType: "venta",
      propertyType: "oficina",
      districts: ["San Isidro"],
      minPrice: 50000,
      maxPrice: 200000,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
