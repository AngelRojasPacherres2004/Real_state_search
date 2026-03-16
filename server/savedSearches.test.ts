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
    res: {} as any,
  };

  return { ctx };
}

describe("savedSearches", () => {
  it("should list user's saved searches", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.savedSearches.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a saved search", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.savedSearches.create({
      name: "Test Search",
      operationType: "alquiler",
      districts: ["San Isidro"],
      minPrice: "800",
      maxPrice: "1200",
    });

    expect(result.success).toBe(true);
  });
});

describe("searchHistory", () => {
  it("should list user's search history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.searchHistory.list({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should record a search", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.searchHistory.record({
      operationType: "venta",
      districts: ["Miraflores"],
      resultsCount: 25,
    });

    expect(result.success).toBe(true);
  });
});

describe("properties.stats", () => {
  it("should return property statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.properties.stats();

    expect(Array.isArray(result)).toBe(true);
  });
});
