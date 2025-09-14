import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserConfig = query({
  args: { userId: v.string() },
  async handler(ctx, args) {
    const userConfig = await ctx.db
      .query("userConfig")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    return userConfig;
  },
});

export const createUserConfig = mutation({
  args: { userId: v.string(), preferences: v.string() },
  async handler(ctx, args) {
    const userConfigDocumentId = await ctx.db.insert("userConfig", {
      userId: args.userId,
      preferences: args.preferences,
    });

    return ctx.db.get(userConfigDocumentId);
  },
});

export const updateUserConfig = mutation({
  args: { id: v.id("userConfig"), preferences: v.string() },
  async handler(ctx, args) {
    const userConfig = await ctx.db.get(args.id);

    if (!userConfig) {
      throw new Error("User config not found");
    }

    await ctx.db.patch(args.id, {
      preferences: args.preferences,
    });

    return ctx.db.get(args.id);
  },
});
