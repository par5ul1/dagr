import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { nonNullAssertion } from "@/utils/nonNullAssertion";

const convexSiteUrl =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
  nonNullAssertion("NEXT_PUBLIC_CONVEX_SITE_URL not set");

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
  plugins: [convexClient()],
});
