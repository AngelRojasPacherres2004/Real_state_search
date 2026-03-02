import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
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

describe("Team Management", () => {
  it("should allow admin to list team members", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.team.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should prevent non-admin from listing team members", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.team.list()).rejects.toThrow();
  });

  it("should allow admin to invite users", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.team.invite({
      email: "newuser@example.com",
      name: "New User",
      role: "user",
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBeDefined();
  });

  it("should prevent non-admin from inviting users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.team.invite({
        email: "newuser@example.com",
        name: "New User",
        role: "user",
      })
    ).rejects.toThrow();
  });
});
