import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userConfig: defineTable({
    userId: v.string(),
    preferences: v.string(),
  }).index("by_userId", ["userId"]),
  goals: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    progress: v.float64(),
    completed: v.boolean(),
    completedAt: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
});
