import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { savedSearches, searchHistory } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(userId: number): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
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

describe("Saved Search and History Deletion", () => {
  const testUserId = 9999;
  const otherUserId = 9998;
  let testSavedSearchId: number;
  let testHistoryId: number;
  let otherUserSavedSearchId: number;
  let otherUserHistoryId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test saved search for user 9999
    const [savedSearch] = await db
      .insert(savedSearches)
      .values({
        userId: testUserId,
        name: "Test Search to Delete",
        operationType: "alquiler",
        districts: JSON.stringify(["San Isidro"]),
      });
    testSavedSearchId = savedSearch.insertId;

    // Create a test search history for user 9999
    const [history] = await db
      .insert(searchHistory)
      .values({
        userId: testUserId,
        operationType: "venta",
        districts: JSON.stringify(["Miraflores"]),
        resultsCount: 10,
      });
    testHistoryId = history.insertId;

    // Create a saved search for other user
    const [otherSearch] = await db
      .insert(savedSearches)
      .values({
        userId: otherUserId,
        name: "Other User's Search",
        operationType: "alquiler",
      });
    otherUserSavedSearchId = otherSearch.insertId;

    // Create a history for other user
    const [otherHistory] = await db
      .insert(searchHistory)
      .values({
        userId: otherUserId,
        operationType: "venta",
        resultsCount: 5,
      });
    otherUserHistoryId = otherHistory.insertId;
  });

  it("should delete a saved search", async () => {
    const { ctx } = createUserContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.savedSearches.delete({ id: testSavedSearchId });
    expect(result.success).toBe(true);

    // Verify it's deleted from database
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const deleted = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.id, testSavedSearchId));
    
    expect(deleted.length).toBe(0);
  });

  it("should delete a search history item", async () => {
    const { ctx } = createUserContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.searchHistory.delete({ id: testHistoryId });
    expect(result.success).toBe(true);

    // Verify it's deleted from database
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const deleted = await db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.id, testHistoryId));
    
    expect(deleted.length).toBe(0);
  });

  it("should not allow deleting another user's saved search", async () => {
    const { ctx } = createUserContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    // Try to delete other user's search
    await caller.savedSearches.delete({ id: otherUserSavedSearchId });

    // Verify it's NOT deleted (should still exist)
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const stillExists = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.id, otherUserSavedSearchId));
    
    expect(stillExists.length).toBe(1);
  });

  it("should not allow deleting another user's search history", async () => {
    const { ctx } = createUserContext(testUserId);
    const caller = appRouter.createCaller(ctx);

    // Try to delete other user's history
    await caller.searchHistory.delete({ id: otherUserHistoryId });

    // Verify it's NOT deleted (should still exist)
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const stillExists = await db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.id, otherUserHistoryId));
    
    expect(stillExists.length).toBe(1);
  });
});
