import type { Metadata } from "next";
import { Glory, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const glorySans = Glory({
  variable: "--font-glory-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Dagr",
  description: "" /* TODO: Add description */,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${glorySans.variable} ${inter.variable} antialiased w-screen h-svh overflow-hidden`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
