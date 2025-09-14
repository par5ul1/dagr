"use node";
import { Agent } from "@convex-dev/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { v } from "convex/values";
import * as z from "zod";
import { api, components } from "./_generated/api";
import { action } from "./_generated/server";
import { nonNullAssertion } from "./auth";
import type { CalendarEvent } from "./calendar";

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY ??
  nonNullAssertion("GOOGLE_GENERATIVE_AI_API_KEY not set");

const openrouterProvider = createOpenRouter({
  apiKey: OPENROUTER_API_KEY,
});

const analyzerAgent = new Agent(components.agent, {
  name: "Dagr Agent - Analyzer",
  languageModel: openrouterProvider("openrouter/sonoma-dusk-alpha"),
  instructions: `You will be provided with a user's preferences, motivations, and current calendar events for the upcoming week. Analyze this information and create a personalized weekly schedule that optimizes their time based on their goals and existing commitments.

Today is ${new Date().toString()}
 
Instructions:

- Review the user's stated preferences and motivations
- Identify gaps in their current calendar
- Suggest specific time blocks for activities that align with their goals
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
      },
    );

    const result = await structureOutputMakerAgent.generateObject(
      ctx,
      { threadId: thread.threadId },
      {
        prompt: [
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
        schema: z.object({
          items: z.array(
            z.object({
              startDay: z.string().describe("YYYY-MM-DD"),
              startTime: z.string().describe("HH:MM (24-hour)"),
              endDay: z.string().describe("YYYY-MM-DD"),
              endTime: z.string().describe("HH:MM (24-hour)"),
              title: z.string().describe("Title of the event"),
              description: z
                .string()
                .describe("Detailed description of the event"),
              summary: z.string().describe("Short summary of the event"),
            }),
          ),
        }),
      },
    );

    const events = result.object.items.map(
      (item): CalendarEvent & { title: string } =>
        ({
          title: item.title,
          summary: item.title,
          description: item.description,
          start: {
            dateTime: createDateFromStrings(
              item.startDay,
              item.startTime,
            ).toISOString(),
            timeZone: "America/Los_Angeles",
          },
          end: {
            dateTime: createDateFromStrings(
              item.endDay,
              item.endTime,
            ).toISOString(),
            timeZone: "America/Los_Angeles",
          },
        }) as CalendarEvent & { title: string },
    );

    await ctx.runAction(api.calendar.insertCalendarEvent, {
      userId: args.userId,
      event: {
        ...events[0]!,
        title: events[0]!.title,
      },
    });

    await Promise.all(
      events.slice(1).map((event) =>
        ctx.runAction(api.calendar.insertCalendarEvent, {
          userId: args.userId,
          event: {
            ...event,
            title: event.title,
          },
        }),
      ),
    );
  },
});

function createDateFromStrings(dateStr: string, timeStr: string) {
  const timeFormatted = timeStr.replace(" ", ":");
  const dateTimeStr = `${dateStr}T${timeFormatted}:00`;
  return new Date(dateTimeStr);
}
