import * as ConvexClientProvider from "./ConvexClientProvider";
import QueryClientProvider from "./QueryClientProvider";
import type { ReactNode } from "react";
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
        <QueryClientProvider>{children}</QueryClientProvider>
      </ConvexClientProvider.ConvexClientProvider>
    </ThemeProvider>
  );
}
