import type { Metadata } from "next";
import "./globals.css";
import "@fontsource-variable/inter";
import { SiteShell } from "@/components/genesys/shell";
import LoadingScreen, { loaderBootScript } from "@/components/genesys/loading-screen";

export const metadata: Metadata = {
  title: { default: "Genesys Now — Digital systems. Built right.", template: "%s — Genesys Now" },
  description: "Custom web applications, business systems, integrations and automation. Built in The Bahamas. Designed for what comes next.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: loaderBootScript }} /></head>
      <body className="antialiased"><LoadingScreen /><SiteShell>{children}</SiteShell></body>
    </html>
  );
}
