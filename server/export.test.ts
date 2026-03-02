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

describe("export.properties", () => {
  it("should export properties to Excel format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.export.properties({
      operationType: "alquiler",
      minPrice: 800,
      maxPrice: 2000,
    });

    expect(result.success).toBe(true);
    expect(result.filename).toBeDefined();
    expect(result.filename).toMatch(/propiedades_\d{4}-\d{2}-\d{2}\.xlsx/);
    expect(result.data).toBeDefined();
    expect(typeof result.data).toBe('string');
    
    // Verify it's valid base64
    expect(() => Buffer.from(result.data, 'base64')).not.toThrow();
  });

  it("should export properties with district filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.export.properties({
      operationType: "alquiler",
      districts: ["San Isidro", "Miraflores"],
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should export properties with bedroom filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.export.properties({
      operationType: "venta",
      minBedrooms: 2,
      maxBedrooms: 3,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});

describe("export.leads", () => {
  it("should export leads to Excel format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.export.leads();

    expect(result.success).toBe(true);
    expect(result.filename).toBeDefined();
    expect(result.filename).toMatch(/leads_\d{4}-\d{2}-\d{2}\.xlsx/);
    expect(result.data).toBeDefined();
    expect(typeof result.data).toBe('string');
    
    // Verify it's valid base64
    expect(() => Buffer.from(result.data, 'base64')).not.toThrow();
  });
});
