import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getGoalsByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("goals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter(
        (q) =>
          q.eq(q.field("deletedAt"), undefined) ||
          q.eq(q.field("deletedAt"), null),
      ) /* TODO: Add index */
      .collect();
  },
});

export const createGoal = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, { userId, title, description, priority = 1 }) => {
    const goal = {
      userId,
      title,
      description,
      progress: 0,
      priority,
    };
    const id = await ctx.db.insert("goals", goal);
    return ctx.db.get(id);
  },
});

export const updateGoal = mutation({
  args: {
    goalId: v.id("goals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    progress: v.optional(v.number()),
    priority: v.optional(v.number()),
    completedAt: v.optional(v.string()),
  },
  handler: async (ctx, goal) => {
    const updates = Object.entries(goal)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce(
        (acc, [key, value]) => {
          if (key !== "goalId") {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await ctx.db.patch(goal.goalId, updates);

    return ctx.db.get(goal.goalId);
  },
});

export const deleteGoal = mutation({
  args: {
    goalId: v.id("goals"),
  },
  handler: async (ctx, { goalId }) => {
    await ctx.db.patch(goalId, {
      deletedAt: new Date().toISOString(),
    });
  },
});
