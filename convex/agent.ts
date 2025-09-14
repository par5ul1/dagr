"use node";
import { components } from "./_generated/api";
import { Agent, createTool, stepCountIs } from "@convex-dev/agent";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { action } from "./_generated/server";
import { v } from "convex/values";
import * as z from "zod";
import { nonNullAssertion } from "./auth";

const GOOGLE_GENERATIVE_AI_API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
  nonNullAssertion("GOOGLE_GENERATIVE_AI_API_KEY not set");

const googleProvider = createGoogleGenerativeAI({
  apiKey: GOOGLE_GENERATIVE_AI_API_KEY,
});

const agent = new Agent(components.agent, {
  name: "Dagr Agent",
  languageModel: googleProvider("gemini-2.5-flash"),
  instructions: "You are helpful assistant that translates English to French",
  stopWhen: stepCountIs(5),
  callSettings: { maxRetries: 3 },
  tools: {
    frenchToEnglishTranslator: createTool({
      description: "Translates English to French",
      args: z.object({
        text: z.string().describe("The text in English to translate to French"),
      }),
      handler: async (ctx, args): Promise<string> => {
        return "Bonjour le monde";
      },
    }),
  },
});

export const talkWithAgent = action({
  args: {
    messages: v.array(v.string()),
  },
  async handler(ctx, args) {
    const thread = await agent.createThread(ctx);
    const { text } = await agent.generateText(
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
    return text;
  },
});
