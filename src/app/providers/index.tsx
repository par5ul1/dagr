import type { ReactNode } from "react";
import { OnboardingGuard, OnboardingProvider } from "@/guards/onboarding";
import * as ConvexClientProvider from "./ConvexClientProvider";
import QueryClientProvider from "./QueryClientProvider";
import { ThemeProvider } from "./ThemeProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexClientProvider.ConvexClientProvider>
        <QueryClientProvider>
          <OnboardingProvider>
            <OnboardingGuard>{children}</OnboardingGuard>
          </OnboardingProvider>
        </QueryClientProvider>
      </ConvexClientProvider.ConvexClientProvider>
    </ThemeProvider>
  );
}
