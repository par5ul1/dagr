import type { ReactNode } from "react";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeProvider } from "./ThemeProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ThemeProvider>
  );
}
