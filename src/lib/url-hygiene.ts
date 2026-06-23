import type { DestinationRiskLevel } from "@unseallink/types/database";

export type UrlAnalysis = {
  blocked: boolean;
  risk_level: DestinationRiskLevel;
  risk_reasons: string[];
  host: string | null;
  platform: string | null;
};

// Domains that host sellable content — low risk regardless of path
const PLATFORM_MAP: Record<string, string> = {
  "notion.so": "notion",
  "notion.site": "notion",
  "figma.com": "figma",
  "canva.com": "canva",
  "airtable.com": "airtable",
  "github.com": "github",
  "gist.github.com": "github",
  "gitlab.com": "gitlab",
  "bitbucket.org": "bitbucket",
  "drive.google.com": "google_drive",
  "docs.google.com": "google_docs",
  "sheets.google.com": "google_sheets",
  "slides.google.com": "google_slides",
  "forms.google.com": "google_forms",
  "discord.com": "discord",
  "discord.gg": "discord",
  "loom.com": "loom",
  "dropbox.com": "dropbox",
  "onedrive.live.com": "onedrive",
  "typeform.com": "typeform",
  "beehiiv.com": "beehiiv",
  "substack.com": "substack",
  "framer.com": "framer",
  "webflow.io": "webflow",
  "webflow.com": "webflow",
  "gumroad.com": "gumroad",
  "vimeo.com": "vimeo",
  "teachable.com": "teachable",
  "kajabi.com": "kajabi",
  "podia.com": "podia",
};

// URL shorteners — opaque redirect, buyer cannot verify destination
const SHORTENERS = new Set([
  "bit.ly",
  "t.co",
  "tinyurl.com",
  "short.io",
  "ow.ly",
  "buff.ly",
  "rebrand.ly",
  "tiny.cc",
  "is.gd",
  "bl.ink",
  "short.gy",
  "cutt.ly",
  "shorturl.at",
  "rb.gy",
  "v.gd",
  "snip.ly",
  "tr.im",
  "lnkd.in",
  "goo.gl",
  "qr.ae",
  "su.pr",
  "po.st",
  "dlvr.it",
  "clck.ru",
]);

// Generic portals — pasting the homepage is not a valid sellable product
const BROAD_DOMAINS = new Set([
  "google.com",
  "www.google.com",
  "microsoft.com",
  "www.microsoft.com",
  "apple.com",
  "www.apple.com",
  "amazon.com",
  "www.amazon.com",
  "facebook.com",
  "www.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
  "linkedin.com",
  "www.linkedin.com",
  "youtube.com",
  "www.youtube.com",
  "yahoo.com",
  "www.yahoo.com",
  "reddit.com",
  "www.reddit.com",
]);

// unseal.link production domains — block recursive paywalls
const UNSEAL_DOMAINS = new Set([
  "unseal.link",
  "www.unseal.link",
  "payfor.link",
  "www.payfor.link",
]);

function getHost(url: string): string | null {
  try {
    return new URL(url.trim()).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Deterministic URL hygiene analysis.
 * Called synchronously — no network requests.
 * Assumes the URL has already passed isValidUrl() (https: only).
 */
export function analyzeDestinationUrl(url: string): UrlAnalysis {
  const host = getHost(url);
  const reasons: string[] = [];

  if (!host) {
    return {
      blocked: true,
      risk_level: "blocked",
      risk_reasons: ["invalid_url"],
      host: null,
      platform: null,
    };
  }

  // Block: recursive unseal.link paywall
  if (UNSEAL_DOMAINS.has(host)) {
    return {
      blocked: true,
      risk_level: "blocked",
      risk_reasons: ["recursive_paywall"],
      host,
      platform: null,
    };
  }

  // Also block unseal paths even on subdomains (e.g. custom-domain.unseal.link)
  if (host.endsWith(".unseal.link") || host.endsWith(".payfor.link")) {
    return {
      blocked: true,
      risk_level: "blocked",
      risk_reasons: ["recursive_paywall"],
      host,
      platform: null,
    };
  }

  // Known platform — low risk
  const platform = PLATFORM_MAP[host] ?? null;
  if (platform) {
    return {
      blocked: false,
      risk_level: "low",
      risk_reasons: [],
      host,
      platform,
    };
  }

  // URL shortener — medium risk (destination opaque to buyer)
  if (SHORTENERS.has(host)) {
    reasons.push("url_shortener");
  }

  // Generic portal/homepage — medium risk
  if (BROAD_DOMAINS.has(host) || BROAD_DOMAINS.has(`www.${host}`)) {
    reasons.push("generic_domain");
  }

  if (reasons.length > 0) {
    return {
      blocked: false,
      risk_level: "medium",
      risk_reasons: reasons,
      host,
      platform: null,
    };
  }

  return {
    blocked: false,
    risk_level: "low",
    risk_reasons: [],
    host,
    platform: null,
  };
}
