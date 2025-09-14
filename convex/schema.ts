import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userConfig: defineTable({
    userId: v.string(),
    preferences: v.object({
      userPersona: v.string(),
      motivations: v.string(),
    }),
    dagrCalendarId: v.optional(v.string()),
    calendars: v.object({
      items: v.array(
        v.union(
          v.object({
            id: v.string(),
            summary: v.string(),
            description: v.string(),
            timeZone: v.string(),
            colorId: v.string(),
            backgroundColor: v.string(),
            foregroundColor: v.string(),
            /* enabled: v.boolean(), */ /* TODO: add this back in */
          }),
          v.record(v.string(), v.any()),
        ),
      ),
    }),
  }).index("by_userId", ["userId"]),
  goals: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    progress: v.float64(),
    priority: v.number(),
    completedAt: v.optional(v.string()),
    deletedAt: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
});
