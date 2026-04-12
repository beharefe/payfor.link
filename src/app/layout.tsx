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
    default: "unseal.link — Sell Any URL. 4.5% Fee. No Uploads. No $100 Minimum.",
    template: "%s | unseal.link",
  },
  description:
    "Turn any Notion, Figma, Drive, GitHub, or Discord URL into a paid link in 60 seconds. Buyers pay via Stripe before they get access. 4.5% fee — half of Gumroad. No file uploads, no storefront, no $100 payout minimum.",
  openGraph: {
    title: "unseal.link — Sell Any URL in 60 Seconds",
    description: "No uploads. No 10% tax. No ghosting. Paste your URL, set a price, get paid first. 4.5% fee, no minimums.",
    url: APP_URL,
    siteName: "unseal.link",
    type: "website",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "unseal.link — Sell any URL in 60 seconds" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "unseal.link — Sell Any URL in 60 Seconds",
    description: "No uploads. No 10% tax. No ghosting. Paste your URL, set a price, get paid first. 4.5% fee, no minimums.",
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
