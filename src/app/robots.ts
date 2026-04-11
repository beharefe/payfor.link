import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // /api/og/ must be accessible so link preview bots can fetch OG images
        allow: ["/", "/api/og/"],
        disallow: ["/dashboard/", "/api/", "/unlock", "/orders"],
      },
      // Social / messaging platform link-preview bots — full access so OG images load
      { userAgent: "Twitterbot",            allow: "/" },
      { userAgent: "facebookexternalhit",   allow: "/" },
      { userAgent: "WhatsApp",              allow: "/" },
      { userAgent: "Discordbot",            allow: "/" },
      { userAgent: "Slackbot-LinkExpanding",allow: "/" },
      { userAgent: "Slackbot",              allow: "/" },
      { userAgent: "TelegramBot",           allow: "/" },
      { userAgent: "LinkedInBot",           allow: "/" },
      // Apple (iMessage uses LPLinkMetadataAgent, web uses Applebot)
      { userAgent: "Applebot",              allow: "/" },
      { userAgent: "LPLinkMetadataAgent",   allow: "/" },
      // AI crawlers
      { userAgent: "GPTBot",        allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ClaudeBot",     allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "anthropic-ai",  allow: "/" },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
