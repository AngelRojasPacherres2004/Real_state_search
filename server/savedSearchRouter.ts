import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const savedSearchRouter = router({
  // List user's saved searches
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await db.getUserSavedSearches(ctx.user.id);
    } catch (error) {
      console.warn('[savedSearches.list] DB unavailable, returning empty list', error);
      return [];
    }
  }),

  // Create a new saved search
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        operationType: z.enum(["alquiler", "venta"]),
        propertyType: z.string().optional(),
        districts: z.array(z.string()).optional(),
        portals: z.array(z.string()).optional(),
        minPrice: z.string().optional(),
        maxPrice: z.string().optional(),
        minBedrooms: z.string().optional(),
        maxBedrooms: z.string().optional(),
        minArea: z.string().optional(),
        maxArea: z.string().optional(),
        publishedWithin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db.createSavedSearch({
          userId: ctx.user.id,
          name: input.name,
          operationType: input.operationType,
          propertyType: input.propertyType || null,
          districts: input.districts ? JSON.stringify(input.districts) : null,
          portals: input.portals ? JSON.stringify(input.portals) : null,
          minPrice: input.minPrice || null,
          maxPrice: input.maxPrice || null,
          minBedrooms: input.minBedrooms || null,
          maxBedrooms: input.maxBedrooms || null,
          minArea: input.minArea || null,
          maxArea: input.maxArea || null,
          publishedWithin: input.publishedWithin || null,
        });
      } catch (error) {
        console.warn('[savedSearches.create] DB unavailable, skipping create', error);
      }

      return { success: true };
    }),

  // Delete a saved search
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteSavedSearch(input.id, ctx.user.id);
      return { success: true };
    }),
});

export const searchHistoryRouter = router({
  // Get user's search history
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ ctx, input }) => {
      return await db.getUserSearchHistory(ctx.user.id, input.limit);
    }),

  // Record a search
  record: protectedProcedure
    .input(
      z.object({
        operationType: z.enum(["alquiler", "venta"]),
        propertyType: z.string().optional(),
        districts: z.array(z.string()).optional(),
        portals: z.array(z.string()).optional(),
        minPrice: z.string().optional(),
        maxPrice: z.string().optional(),
        minBedrooms: z.string().optional(),
        maxBedrooms: z.string().optional(),
        minArea: z.string().optional(),
        maxArea: z.string().optional(),
        publishedWithin: z.string().optional(),
        resultsCount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db.createSearchHistory({
          userId: ctx.user.id,
          propertyType: input.propertyType || null,
          operationType: input.operationType,
          districts: input.districts ? JSON.stringify(input.districts) : null,
          portals: input.portals ? JSON.stringify(input.portals) : null,
          minPrice: input.minPrice || null,
          maxPrice: input.maxPrice || null,
          minBedrooms: input.minBedrooms || null,
          maxBedrooms: input.maxBedrooms || null,
          minArea: input.minArea || null,
          maxArea: input.maxArea || null,
          publishedWithin: input.publishedWithin || null,
          resultsCount: input.resultsCount || 0,
        });
      } catch (error) {
        console.warn('[searchHistory.record] DB unavailable, skipping record', error);
      }

      return { success: true };
    }),

  // Delete a search history item
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteSearchHistory(input.id, ctx.user.id);
      return { success: true };
    }),
});
