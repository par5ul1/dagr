import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getGoalsByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("goals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const createGoal = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { userId, title, description }) => {
    const now = new Date();
    const goal = {
      userId,
      title,
      description,
      progress: 0,
      createdAt: now,
      updatedAt: now,
      completed: false,
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
    completed: v.optional(v.boolean()),
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
