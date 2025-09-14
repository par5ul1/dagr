"use node";
import { components } from "./_generated/api";
import { Agent } from "@convex-dev/agent";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { action } from "./_generated/server";
import { v } from "convex/values";
import * as z from "zod";
import { nonNullAssertion } from "./auth";
import { CalendarEvent } from "./calendar";

const GOOGLE_GENERATIVE_AI_API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
  nonNullAssertion("GOOGLE_GENERATIVE_AI_API_KEY not set");

const googleProvider = createGoogleGenerativeAI({
  apiKey: GOOGLE_GENERATIVE_AI_API_KEY,
});

const analyzerAgent = new Agent(components.agent, {
  name: "Dagr Agent - Analyzer",
  languageModel: googleProvider("gemini-2.5-flash"),
  instructions: `You will be provided with a user's preferences, motivations, and current calendar events for the upcoming week. Analyze this information and create a personalized weekly schedule that optimizes their time based on their goals and existing commitments.
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
  languageModel: googleProvider("gemini-2.5-flash"),
  instructions: `You are an expert at taking unstructured text and converting it into a structured JSON format. Given the user's preferences and motivations, create a structured JSON object that captures all relevant details in a clear and organized manner.`,
  callSettings: { maxRetries: 3 },
});

export const talkWithAgent = action({
  args: {
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
      (item): CalendarEvent =>
        ({
          id: item.title.toLowerCase().replace(/\s+/g, "-"),
          summary: item.title,
          description: item.description,
          start: {
            dateTime: createDateFromStrings(
              item.startDay,
              item.startTime,
            ).toISOString(),
          },
          end: {
            dateTime: createDateFromStrings(
              item.endDay,
              item.endTime,
            ).toISOString(),
          },
        }) as CalendarEvent,
    );
    return events;
  },
});

function createDateFromStrings(dateStr: string, timeStr: string) {
  const timeFormatted = timeStr.replace(" ", ":");
  const dateTimeStr = `${dateStr}T${timeFormatted}:00`;
  return new Date(dateTimeStr);
}
