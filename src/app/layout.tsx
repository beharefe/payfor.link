import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Amplitude } from "@unseallink/lib/amplitude";
import { ThemeProvider } from "@unseallink/components/theme-provider";
import "./globals.css";
import { Inter, Source_Sans_3 } from "next/font/google";
import { cn } from "@unseallink/lib/utils";

const sourceSans3Heading = Source_Sans_3({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: t("title"),
      template: "%s | unseal.link",
    },
    description: t("description"),
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      url: APP_URL,
      siteName: "unseal.link",
      type: "website",
      images: [
        {
          url: "/og-default.png",
          width: 1200,
          height: 630,
          alt: "unseal.link — Sell any link, instantly",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("og_title"),
      description: t("og_description"),
      images: ["/og-default.png"],
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
