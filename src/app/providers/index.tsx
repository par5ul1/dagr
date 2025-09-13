import type { ReactNode } from "react";
import { ConvexClientProvider } from "./ConvexClientProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
