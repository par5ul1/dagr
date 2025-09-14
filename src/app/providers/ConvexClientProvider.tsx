"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { authClient } from "@/lib/authClient";
import { nonNullAssertion } from "@/utils/nonNullAssertion";

export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ??
    nonNullAssertion("NEXT_PUBLIC_CONVEX_URL needs to be set"),
  {
    verbose: true,
    expectAuth: true,
  }
);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
