import type { Metadata } from "next";
import { AnalyticsProvider } from "@unseallink/components/analytics-provider";
import { ThemeProvider } from "@unseallink/components/theme-provider";
import "./globals.css";
import { Inter, Source_Sans_3 } from "next/font/google";
import { cn } from "@unseallink/lib/utils";

const sourceSans3Heading = Source_Sans_3({ subsets: ["latin"], variable: "--font-heading" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "unseal.link — Sell any link, instantly",
    template: "%s | unseal.link",
  },
  description:
    "Paste a link, set a price, share your paywall. Buyers pay once and get instant access. Keep 95.5% of every sale.",
  openGraph: {
    title: "unseal.link — Sell any link, instantly",
    description: "The simplest paywall on the internet. Paste a link, set a price, get paid. No monthly fees.",
    url: APP_URL,
    siteName: "unseal.link",
    type: "website",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "unseal.link · Sell any link, instantly" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "unseal.link — Sell any link, instantly",
    description: "The simplest paywall on the internet. Paste a link, set a price, get paid. No monthly fees.",
    images: ["/api/og"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(inter.variable, sourceSans3Heading.variable)} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AnalyticsProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
