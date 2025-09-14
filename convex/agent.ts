"use node";
import { Agent } from "@convex-dev/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { v } from "convex/values";
import { z } from "zod";
import { api, components } from "./_generated/api";
import { action } from "./_generated/server";
import { nonNullAssertion } from "./auth";
import type { CalendarEvent } from "./calendar";

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY ??
  nonNullAssertion("OPENROUTER_API_KEY not set");

const openrouterProvider = createOpenRouter({
  apiKey: OPENROUTER_API_KEY,
});

/* TODO: Remove bit on rearranging events because we do want it, but better */
const analyzerAgent = new Agent(components.agent, {
  name: "Dagr Agent - Analyzer",
  languageModel: openrouterProvider("openrouter/sonoma-dusk-alpha"),
  instructions: `You will be provided with a user's preferences, motivations, and current calendar events for the upcoming week. Analyze this information and create a personalized weekly schedule that optimizes their time based on their goals and existing commitments.

Today is ${new Date().toString()}
 
Instructions:

- Review the user's stated preferences and motivations
- Analyze existing calendar events to identify available time slots
- Avoid scheduling conflicts with existing events
- Break down large tasks into smaller, focused time blocks (25-90 minutes)
- Group related tasks together for better efficiency
- Consider energy levels throughout the day (deep work in morning, lighter tasks in afternoon)
- Leave buffer time between tasks for transitions
- Do not recreate any events that exist already. Just focus on placing the user's goals in the best possible time slots.
- Format your output as a day-by-day schedule

Output Format:
[Monday: 5:00pm-6:00pm work on umem project, 8:00pm-10:00pm work on O1 visa evidence gathering]
[Tuesday: 7:00pm-8:00pm try painting, 9:00pm-10:00pm work on umem project]
[Wednesday: ...]`,
  callSettings: { maxRetries: 3 },
});

const structureOutputMakerAgent = new Agent(components.agent, {
  name: "Dagr Agent - Structure Output Maker",
  languageModel: openrouterProvider("openrouter/sonoma-dusk-alpha"),
  instructions: `
Today is ${new Date().toString()}. You are an expert at taking unstructured text and converting it into a structured JSON format. Given the user's preferences and motivations, create a structured JSON object that captures all relevant details in a clear and organized manner.`,
  callSettings: { maxRetries: 3 },
});

export const talkWithAgent = action({
  args: {
    userId: v.string(),
    messages: v.array(v.string()),
  },
  async handler(ctx, args) {
    const firstMessage = args.messages[0];
    if (!firstMessage) {
      throw new Error("No messages provided");
    }

    const timezone = extractTimezoneFromMessage(firstMessage);

    const thread = await analyzerAgent.createThread(ctx);
    const { text } = await analyzerAgent.generateText(
      ctx,
      { threadId: thread.threadId },
      {
        prompt: [
          {
            role: "user",
            content: args.messages.map((message) => ({
              type: "text",
              text: message,
            })),
          },
        ],
      }
    );

    const schema = z.object({
      items: z.array(
        z.object({
          startDay: z.string().describe("YYYY-MM-DD"),
          startTime: z.string().describe("HH:MM (24-hour)"),
          endDay: z.string().describe("YYYY-MM-DD"),
          endTime: z.string().describe("HH:MM (24-hour)"),
          title: z.string().describe("Title of the event"),
          description: z.string().describe("Detailed description of the event"),
          summary: z.string().describe("Short summary of the event"),
        })
      ),
    });

    const result = await structureOutputMakerAgent.generateObject(
      ctx,
      { threadId: thread.threadId },
      /* @ts-expect-error - the type should work */
      {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Here is the unstructured schedule text:\n\n${text}\n\nPlease convert this into a structured JSON format with the following fields for each event: startDay (YYYY-MM-DD), startTime (HH:MM 24-hour), endDay (YYYY-MM-DD), endTime (HH:MM 24-hour), title, description, summary.`,
              },
            ],
          },
        ],
        schema,
      }
    );

    const events = result.object.items.map(
      (
        item: z.infer<typeof schema>["items"][0]
      ): CalendarEvent & { title: string } => {
        const startDateTime = createDateFromStrings(
          item.startDay,
          item.startTime
        );
        const endDateTime = createDateFromStrings(item.endDay, item.endTime);

        return {
          title: item.title,
          summary: item.title,
          description: item.description,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: timezone,
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: timezone,
          },
        } as CalendarEvent & { title: string };
      }
    );

    for (const event of events) {
      try {
        await ctx.runAction(api.calendar.insertCalendarEvent, {
          userId: args.userId,
          event: {
            title: event.title,
            summary: event.summary,
            description: event.description,
            start: event.start,
            end: event.end,
          },
        });
      } catch (error) {
        console.error(`Failed to insert event "${event.title}":`, error);
      }
    }
  },
});

function createDateFromStrings(dateStr: string, timeStr: string) {
  const timeFormatted = timeStr.replace(" ", ":");
  const dateTimeStr = `${dateStr}T${timeFormatted}:00`;
  return new Date(dateTimeStr);
}

function extractTimezoneFromMessage(message: string): string {
  try {
    const calendarEventsMatch = message.match(
      /User's Calendar Events\s*(\[.*?\])/s
    );
    if (!calendarEventsMatch) {
      return "UTC";
    }

    const calendarEventsStr = calendarEventsMatch[1];
    const calendarEvents = JSON.parse(calendarEventsStr);

    if (!Array.isArray(calendarEvents) || calendarEvents.length === 0) {
      return "UTC";
    }

    for (const event of calendarEvents) {
      if (event.start?.timeZone) {
        return event.start.timeZone;
      }
      if (event.end?.timeZone) {
        return event.end.timeZone;
      }
    }

    for (const event of calendarEvents) {
      if (event.start?.dateTime) {
        const dateTime = new Date(event.start.dateTime);
        const offset = dateTime.getTimezoneOffset();
        const timezone = getTimezoneFromOffset(offset);
        if (timezone) return timezone;
      }
    }

    return "UTC";
  } catch (error) {
    console.error("Error extracting timezone from message:", error);
    return "UTC";
  }
}

function getTimezoneFromOffset(offsetMinutes: number): string | null {
  const offsetHours = -offsetMinutes / 60;

  const timezoneMap: { [key: number]: string } = {
    [-12]: "Pacific/Kwajalein",
    [-11]: "Pacific/Midway",
    [-10]: "Pacific/Honolulu",
    [-9]: "America/Anchorage",
    [-8]: "America/Los_Angeles",
    [-7]: "America/Denver",
    [-6]: "America/Chicago",
    [-5]: "America/New_York",
    [-4]: "America/Caracas",
    [-3]: "America/Sao_Paulo",
    [-2]: "Atlantic/South_Georgia",
    [-1]: "Atlantic/Azores",
    [0]: "UTC",
    [1]: "Europe/London",
    [2]: "Europe/Paris",
    [3]: "Europe/Moscow",
    [4]: "Asia/Dubai",
    [5]: "Asia/Karachi",
    [6]: "Asia/Dhaka",
    [7]: "Asia/Bangkok",
    [8]: "Asia/Shanghai",
    [9]: "Asia/Tokyo",
    [10]: "Australia/Sydney",
    [11]: "Pacific/Norfolk",
    [12]: "Pacific/Auckland",
  };

  return timezoneMap[offsetHours] || null;
}
