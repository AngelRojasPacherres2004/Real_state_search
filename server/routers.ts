import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { PropertyScraper, type SearchParams } from "./scrapers";
import { savedSearchRouter, searchHistoryRouter } from "./savedSearchRouter";

const scraper = new PropertyScraper();

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  properties: router({
    search: protectedProcedure
      .input(z.object({
        operationType: z.enum(['alquiler', 'venta']).optional(),
        propertyType: z.string().optional(),
        districts: z.array(z.string()).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        currency: z.string().optional(),
        minArea: z.number().optional(),
        maxArea: z.number().optional(),
        minBedrooms: z.number().optional(),
        maxBedrooms: z.number().optional(),
        minBathrooms: z.number().optional(),
        maxBathrooms: z.number().optional(),
        amenities: z.array(z.string()).optional(),
        portals: z.array(z.string()).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        // Search in database first
        const dbResults = await db.searchProperties(input);
        
        // If we have recent results, return them
        if (dbResults.length > 0) {
          return {
            properties: dbResults,
            source: 'database' as const,
            total: dbResults.length,
          };
        }

        // Otherwise, attempt scraping across configured portals
        // (scrapers currently may return empty arrays if not implemented)
        const mockProperties = await scraper.scrapeAll(input as SearchParams);
        
        // Filter mock properties based on input
        let filtered = mockProperties;
        
        if (input.operationType) {
          filtered = filtered.filter(p => p.operationType === input.operationType);
        }
        
        if (input.districts && input.districts.length > 0) {
          filtered = filtered.filter(p => input.districts!.includes(p.district));
        }
        
        if (input.minPrice !== undefined) {
          filtered = filtered.filter(p => p.price >= input.minPrice!);
        }
        
        if (input.maxPrice !== undefined) {
          filtered = filtered.filter(p => p.price <= input.maxPrice!);
        }
        
        if (input.minBedrooms !== undefined) {
          filtered = filtered.filter(p => (p.bedrooms || 0) >= input.minBedrooms!);
        }
        
        if (input.maxBedrooms !== undefined) {
          filtered = filtered.filter(p => (p.bedrooms || 0) <= input.maxBedrooms!);
        }
        
        if (input.minArea !== undefined) {
          filtered = filtered.filter(p => (p.area || 0) >= input.minArea!);
        }
        
        if (input.maxArea !== undefined) {
          filtered = filtered.filter(p => (p.area || 0) <= input.maxArea!);
        }
        
        if (input.minBathrooms !== undefined) {
          filtered = filtered.filter(p => (p.bathrooms || 0) >= input.minBathrooms!);
        }
        
        if (input.maxBathrooms !== undefined) {
          filtered = filtered.filter(p => (p.bathrooms || 0) <= input.maxBathrooms!);
        }
        
        if (input.propertyType) {
          filtered = filtered.filter(p => p.propertyType.toLowerCase() === input.propertyType!.toLowerCase());
        }
        
        if (input.amenities && input.amenities.length > 0) {
          filtered = filtered.filter(p => {
            if (!p.amenities || p.amenities.length === 0) return false;
            // Check if property has ALL selected amenities
            return input.amenities!.every(amenity => 
              p.amenities!.some(propAmenity => 
                propAmenity.toLowerCase().includes(amenity.toLowerCase())
              )
            );
          });
        }

        // Store in database for future queries
        for (const prop of filtered.slice(0, 20)) {
          try {
            await db.upsertProperty({
              externalId: prop.externalId,
              portal: prop.portal,
              title: prop.title,
              description: prop.description,
              operationType: prop.operationType,
              propertyType: prop.propertyType,
              price: prop.price.toString(),
              currency: prop.currency,
              area: prop.area?.toString(),
              bedrooms: prop.bedrooms,
              bathrooms: prop.bathrooms,
              district: prop.district,
              province: prop.province,
              department: prop.department,
              address: prop.address,
              latitude: prop.latitude?.toString(),
              longitude: prop.longitude?.toString(),
              imageUrl: prop.imageUrl,
              sourceUrl: prop.sourceUrl,
              amenities: prop.amenities ? JSON.stringify(prop.amenities) : null,
            });
          } catch (error) {
            console.error('Error upserting property:', error);
          }
        }
        
        return {
          properties: filtered.slice(input.offset || 0, (input.offset || 0) + (input.limit || 50)),
          source: 'scraper' as const,
          total: filtered.length,
        };
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPropertyById(input.id);
      }),

    getPriceHistory: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPriceHistory(input.propertyId);
      }),

    stats: protectedProcedure.query(async () => {
      return await db.getPropertyStatsByDistrict();
    }),
  }),

  favorites: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserFavorites(ctx.user.id);
      }),

    add: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addFavorite({
          userId: ctx.user.id,
          propertyId: input.propertyId,
          notes: input.notes,
        });
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFavorite(ctx.user.id, input.propertyId);
        return { success: true };
      }),
    updateNotes: protectedProcedure
      .input(z.object({ propertyId: z.number(), notes: z.string().nullable() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateFavoriteNotes(ctx.user.id, input.propertyId, input.notes);
        return { success: true };
      }),

    isFavorite: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.isFavorite(ctx.user.id, input.propertyId);
      }),
  }),

  alerts: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserAlerts(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        operationType: z.enum(['alquiler', 'venta']).optional(),
        propertyType: z.string().optional(),
        districts: z.array(z.string()).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        currency: z.string().optional(),
        minArea: z.number().optional(),
        maxArea: z.number().optional(),
        minBedrooms: z.number().optional(),
        maxBedrooms: z.number().optional(),
        minBathrooms: z.number().optional(),
        maxBathrooms: z.number().optional(),
        amenities: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const alertId = await db.createAlert({
          userId: ctx.user.id,
          name: input.name,
          operationType: input.operationType,
          propertyType: input.propertyType,
          districts: input.districts ? JSON.stringify(input.districts) : null,
          minPrice: input.minPrice?.toString(),
          maxPrice: input.maxPrice?.toString(),
          currency: input.currency,
          minArea: input.minArea?.toString(),
          maxArea: input.maxArea?.toString(),
          minBedrooms: input.minBedrooms,
          maxBedrooms: input.maxBedrooms,
          minBathrooms: input.minBathrooms,
          maxBathrooms: input.maxBathrooms,
          amenities: input.amenities ? JSON.stringify(input.amenities) : null,
        });
        return { success: true, alertId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean().optional(),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateAlert(input.id, {
          isActive: input.isActive,
          name: input.name,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAlert(input.id);
        return { success: true };
      }),

    checkNow: protectedProcedure.mutation(async () => {
      const { checkAlertsAndNotify } = await import("./emailNotifications");
      await checkAlertsAndNotify();
      return { success: true, message: "Alertas verificadas y notificaciones enviadas" };
    }),
  }),

  leads: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserLeads(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        propertyId: z.number().optional(),
        interestedIn: z.string().optional(),
        source: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const leadId = await db.createLead({
          userId: ctx.user.id,
          name: input.name,
          email: input.email,
          phone: input.phone,
          propertyId: input.propertyId,
          interestedIn: input.interestedIn,
          source: input.source,
          notes: input.notes,
        });
        return { success: true, leadId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['nuevo', 'contactado', 'calificado', 'convertido', 'descartado']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateLead(input.id, {
          status: input.status,
          notes: input.notes,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLead(input.id);
        return { success: true };
      }),
  }),

  analytics: router({
    statsByDistrict: protectedProcedure
      .input(z.object({
        operationType: z.enum(['alquiler', 'venta']).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getPropertyStatsByDistrict(input.operationType);
      }),

    statsByPortal: protectedProcedure
      .input(z.object({
        operationType: z.enum(['alquiler', 'venta']).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getPropertyStatsByPortal(input.operationType);
      }),
  }),

  team: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Only admins can list team members
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo administradores pueden ver el equipo' });
      }
      return await db.getAllUsers();
    }),

    invite: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        role: z.enum(['user', 'admin']).default('user'),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo administradores pueden invitar usuarios' });
        }
        
        // In a real implementation, this would send an email invitation
        // For now, we'll create a placeholder user
        const userId = await db.createUser({
          email: input.email,
          name: input.name,
          role: input.role,
        });
        
        return { success: true, userId };
      }),

    remove: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        // Prevent removing yourself
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No puedes eliminarte a ti mismo' });
        }
        
        await db.deleteUser(input.userId);
        return { success: true };
      }),

    updateRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['user', 'admin']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  export: router({
    properties: protectedProcedure
      .input(
        z.object({
          operationType: z.enum(["alquiler", "venta"]).optional(),
          propertyType: z.string().optional(),
          districts: z.array(z.string()).optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          minBedrooms: z.number().optional(),
          maxBedrooms: z.number().optional(),
          minArea: z.number().optional(),
          maxArea: z.number().optional(),
          portals: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { exportPropertiesToExcel } = await import("./excelExport");
        const properties = await db.searchProperties({
          ...input,
          limit: 10000, // Export all matching properties
        });

        const buffer = await exportPropertiesToExcel(properties);
        const base64 = buffer.toString('base64');
        
        return {
          success: true,
          filename: `propiedades_${new Date().toISOString().split('T')[0]}.xlsx`,
          data: base64,
        };
      }),
    leads: protectedProcedure.mutation(async ({ ctx }) => {
      const { exportLeadsToExcel } = await import("./excelExport");
      const leadsData = await db.getUserLeads(ctx.user.id);
      const leads = leadsData.map((item: any) => item.lead);

      const buffer = await exportLeadsToExcel(leads);
      const base64 = buffer.toString('base64');
      
      return {
        success: true,
        filename: `leads_${new Date().toISOString().split('T')[0]}.xlsx`,
        data: base64,
      };
    }),
  }),

  savedSearches: savedSearchRouter,
  searchHistory: searchHistoryRouter,

  import: router({
    octoparse: protectedProcedure
      .input(z.object({
        csvData: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo administradores pueden importar datos' });
        }
        
        const { parseCSV, importFromOctoparse } = await import('./octoparseImport');
        const data = parseCSV(input.csvData);
        const result = await importFromOctoparse(data);
        
        return result;
      }),

    template: protectedProcedure.query(async () => {
      const { OCTOPARSE_CSV_TEMPLATE, EXPECTED_FIELDS } = await import('./octoparseImport');
      return {
        template: OCTOPARSE_CSV_TEMPLATE,
        fields: EXPECTED_FIELDS,
      };
    }),
  }),
  
  reports: router({
    generateWeekly: protectedProcedure.mutation(async ({ ctx }) => {
      const { generateWeeklyReport } = await import("./scheduledReports");
      return await generateWeeklyReport(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
