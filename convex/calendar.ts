import { type Infer, v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { authComponent, createAuth, nonNullAssertion } from "./auth";
import { GOOGLE_CALENDAR_API_BASE_URL } from "./userConfig";

export const calendarEventSchema = v.object({
  created: v.string(),
  creator: v.object({
    displayName: v.string(),
    email: v.string(),
    self: v.boolean(),
  }),
  description: v.string(),
  end: v.object({
    date: v.string(),
  }),
  etag: v.string(),
  eventType: v.string(),
  htmlLink: v.string(),
  iCalUID: v.string(),
  id: v.string(),
  kind: v.string(),
  organizer: v.object({
    displayName: v.string(),
    email: v.string(),
    self: v.boolean(),
  }),
  sequence: v.number(),
  start: v.object({
    date: v.string(),
  }),
  status: v.string(),
  summary: v.string(),
  transparency: v.string(),
  updated: v.string(),
  visibility: v.string(),
});

export type CalendarEvent = Infer<typeof calendarEventSchema>;

export const getAllEventsForUser = action({
  args: {
    userId: v.string(),
    calendarIds: v.array(v.string()),
    timeMin: v.string(),
    timeMax: v.string(),
    maxEvents: v.number(),
  },
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

    const events = await Promise.all(
      args.calendarIds.map(async (calendarId) => {
        const response = await fetch(
          `${GOOGLE_CALENDAR_API_BASE_URL}/calendars/${encodeURIComponent(calendarId.trim())}/events?timeMin=${args.timeMin}&timeMax=${args.timeMax}`,
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
        const data = (await response.json()).items;
        return data as CalendarEvent[];
      })
    );

    return events.flat();
  },
});

const insertCalendarEventSchema = v.object({
  start: v.object({
    // The date, in the format "yyyy-mm-dd", if this is an all-day event.
    date: v.string(),
    // The time, as a combined date-time value (formatted according to RFC3339). A time zone offset is required unless a time zone is explicitly specified in timeZone.
    dateTime: v.string(),
    // The time zone in which the time is specified. (Formatted as an IANA Time Zone Database name, e.g. "Europe/Zurich".) For recurring events this field is required and specifies the time zone in which the recurrence is expanded. For single events this field is optional and indicates a custom time zone for the event start/end.
    timeZone: v.string(),
  }),
  end: v.object({
    date: v.string(),
    dateTime: v.string(),
    timeZone: v.string(),
  }),
  originalStartTime: v.object({
    date: v.string(),
    dateTime: v.string(),
    timeZone: v.string(),
  }),
  id: v.string(),
  // Title of the event.
  summary: v.string(),
  // Description of the event. Can contain HTML. Optional.
  description: v.string(),
});

export const insertCalendarEvent = action({
  args: {
    userId: v.string(),
    event: insertCalendarEventSchema,
  },
  async handler(ctx, { event, userId }) {
    let userConfig = await ctx.runQuery(api.userConfig.getUserConfig, {
      userId,
    });

    if (!userConfig) throw new Error("User config not found");

    if (!userConfig.dagrCalendarId) {
      await ctx.runAction(api.userConfig.createDagrCalendarForUser, { userId });
      userConfig =
        (await ctx.runQuery(api.userConfig.getUserConfig, {
          userId,
        })) ?? nonNullAssertion("User config should exist after creation");
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE_URL}/calendars/${encodeURIComponent(userConfig.dagrCalendarId?.trim() ?? nonNullAssertion("DagrCalendarId must exist in the userConfig"))}/events`,
      {}
    );
  },
});
