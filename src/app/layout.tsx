import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Amplitude } from "@unseallink/lib/amplitude";
import "./globals.css";

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
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <Amplitude />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
