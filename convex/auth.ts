import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";

const nonNullAssertion = (message: string) => {
  throw new Error(`NonNullAssetion: ${message}`);
};

const siteUrl = process.env.SITE_URL ?? nonNullAssertion("SITE_URL not set");
const NODE_ENV = process.env.NODE_ENV ?? ("development" as const);

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth, {
  verbose: NODE_ENV === "development",
});

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    // Configure simple, non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      google: {
        enabled: true,
        clientId:
          process.env.GOOGLE_CLIENT_ID ??
          nonNullAssertion("GOOGLE_CLIENT_ID not set"),
        clientSecret:
          process.env.GOOGLE_CLIENT_SECRET ??
          nonNullAssertion("GOOGLE_CLIENT_SECRET not set"),
      },
    },
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex(),
    ],
  });
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
