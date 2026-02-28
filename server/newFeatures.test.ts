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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("New Features Tests", () => {
  describe("Favorites Notes", () => {
    it("should update favorite notes successfully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.favorites.updateNotes({
        propertyId: 1,
        notes: "Esta propiedad tiene buena ubicación",
      });

      expect(result).toEqual({ success: true });
    });

    it("should allow null notes", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.favorites.updateNotes({
        propertyId: 1,
        notes: null,
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe("Saved Searches with publishedWithin", () => {
    it("should create saved search with publishedWithin filter", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.savedSearches.create({
        name: "Búsqueda reciente",
        operationType: "alquiler",
        districts: ["San Isidro"],
        publishedWithin: "24h",
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe("Search History with publishedWithin", () => {
    it("should record search history with publishedWithin", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.searchHistory.record({
        operationType: "venta",
        districts: ["Miraflores"],
        publishedWithin: "week",
        resultsCount: 25,
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe("Weekly Reports", () => {
    it("should generate weekly report", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reports.generateWeekly();

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
    });
  });
});
