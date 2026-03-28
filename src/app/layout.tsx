import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Amplitude } from "@unseallink/lib/amplitude";
import { ThemeProvider } from "@unseallink/components/theme-provider";
import "./globals.css";
import { Inter, Source_Sans_3 } from "next/font/google";
import { headers } from "next/headers";
import { cn } from "@unseallink/lib/utils";

const sourceSans3Heading = Source_Sans_3({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const h = await headers();
  const host = h.get("host") ?? "unseal.link";
  // x-forwarded-proto may be absent on some hosts; default to https in production
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const appUrl = `${proto}://${host}`;
  return {
    metadataBase: new URL(appUrl),
    title: {
      default: t("title"),
      template: "%s | unseal.link",
    },
    description: t("description"),
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      url: appUrl,
      siteName: "unseal.link",
      type: "website",
      images: [
        {
          url: "/api/og",
          width: 1200,
          height: 630,
          alt: "unseal.link · Sell any link, instantly",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("og_title"),
      description: t("og_description"),
      images: ["/api/og"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={cn(inter.variable, sourceSans3Heading.variable)} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider messages={messages}>
            <Amplitude />
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
