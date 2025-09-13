import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { nonNullAssertion } from "@/utils/nonNullAssertion";

const convexSiteUrl =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
  nonNullAssertion("NEXT_PUBLIC_CONVEX_SITE_URL not set");
// __AUTO_GENERATED_PRINT_VAR_START__
console.log(" convexSiteUrl:", convexSiteUrl); // __AUTO_GENERATED_PRINT_VAR_END__

export const authClient = createAuthClient({
  baseURL: convexSiteUrl,
  plugins: [convexClient()],
});
