import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { authComponent, createAuth, nonNullAssertion } from "./auth";
import schema from "./schema";

export const GOOGLE_CALENDAR_API_BASE_URL =
  "https://www.googleapis.com/calendar/v3";

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

export const createDagrCalendarForUser = action({
  args: { userId: v.string() },
  async handler(ctx, args) {
    let accessToken: string;
    try {
      accessToken = (
        await createAuth(ctx).api.getAccessToken({
          body: {
            providerId: "google",
            userId: args.userId,
          },
          headers: await authComponent.getHeaders(ctx),
        })
      ).accessToken;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error}`);
    }

    const id = `dagr-${args.userId}`;

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE_URL}/users/me/calendarList`,
      {
        method: "POST",
        body: JSON.stringify({
          id,
        }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "only-if-cached",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Google API error: ${response.status} ${response.statusText}`
      );
    }

    const userConfig =
      (await ctx.runQuery(api.userConfig.getUserConfig, {
        userId: args.userId,
      })) ?? nonNullAssertion("User config not found");

    await ctx.runMutation(api.userConfig.updateUserConfig, {
      id: userConfig._id,
      calendarId: id,
    });
  },
});

/* TODO: Don't overwrite the enabled field when we have that */
export const syncGoogleCalendarWithUserConfig = action({
  args: {
    userId: v.string(),
    userConfigId: v.id("userConfig"),
  },
  async handler(ctx, { userId, userConfigId }) {
    let accessToken: string;
    try {
      accessToken = (
        await createAuth(ctx).api.getAccessToken({
          body: {
            providerId: "google",
            userId: userId,
          },
          headers: await authComponent.getHeaders(ctx),
        })
      ).accessToken;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error}`);
    }
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE_URL}/users/me/calendarList`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "only-if-cached",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Google API error: ${response.status} ${response.statusText}`
      );
    }

    await ctx.runMutation(api.userConfig.updateUserConfig, {
      id: userConfigId,
      calendars: { items: (await response.json()).items },
    });
  },
});

export const createUserConfig = mutation({
  args: {
    userId: v.string(),
    preferences: v.optional(
      schema.tables.userConfig.validator.fields.preferences
    ),
  },
  async handler(ctx, args) {
    const userConfigDocumentId = await ctx.db.insert("userConfig", {
      userId: args.userId,
      preferences: args.preferences ?? { userPersona: "", motivations: "" },
      calendars: { items: [] },
    });

    await ctx.scheduler.runAfter(
      0,
      api.userConfig.syncGoogleCalendarWithUserConfig,
      {
        userId: args.userId,
        userConfigId: userConfigDocumentId,
      }
    );

    return ctx.db.get(userConfigDocumentId);
  },
});

export const updateUserConfig = mutation({
  args: {
    id: v.id("userConfig"),
    preferences: v.optional(
      schema.tables.userConfig.validator.fields.preferences
    ),
    calendars: v.optional(schema.tables.userConfig.validator.fields.calendars),
    calendarId: v.optional(v.string()),
  },

  async handler(ctx, args) {
    const userConfig = await ctx.db.get(args.id);

    if (!userConfig) {
      throw new Error("User config not found");
    }

    const updates = {
      preferences: args.preferences ?? userConfig.preferences,
      calendars: args.calendars ?? userConfig.calendars,
      dagrCalendarId: args.calendarId ?? userConfig.dagrCalendarId,
    };

    await ctx.db.patch(args.id, updates);
    return ctx.db.get(args.id);
  },
});
