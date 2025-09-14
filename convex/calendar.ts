import { v } from "convex/values";
import { action } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { GOOGLE_CALENDAR_API_BASE_URL } from "./userConfig";

export type CalendarEvent = {
  created: string;
  creator: {
    displayName: string;
    email: string;
    self: boolean;
  };
  description: string;
  end: {
    date: string;
  };
  etag: string;
  eventType: string;
  htmlLink: string;
  iCalUID: string;
  id: string;
  kind: string;
  organizer: {
    displayName: string;
    email: string;
    self: boolean;
  };
  sequence: number;
  start: {
    date: string;
  };
  status: string;
  summary: string;
  transparency: string;
  updated: string;
  visibility: string;
};

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
          },
        );
        if (!response.ok) {
          throw new Error(
            `Google API error: ${response.status} ${response.statusText}`,
          );
        }
        const data = (await response.json()).items;
        return data as CalendarEvent[];
      }),
    );

    return events.flat();
  },
});
