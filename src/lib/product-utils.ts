import type { ProductType } from "@unseallink/types/database";

// TODO: move to a `platforms` table in Supabase once we have real usage data.
// That way sellers/admins can add new platforms without a deploy, and we can
// track which platforms are actually popular on the platform.
const HOST_MAP: Record<string, { label: string; type: ProductType }> = {
  "notion.so": { label: "Open in Notion", type: "template" },
  "notion.site": { label: "Open in Notion", type: "template" },
  "figma.com": { label: "Open in Figma", type: "template" },
  "docs.google.com": { label: "Open in Google Docs", type: "template" },
  "drive.google.com": { label: "Open in Google Drive", type: "file" },
  "sheets.google.com": { label: "Open in Google Sheets", type: "template" },
  "github.com": { label: "Open on GitHub", type: "other" },
  "canva.com": { label: "Open in Canva", type: "template" },
  "airtable.com": { label: "Open in Airtable", type: "dataset" },
  "typeform.com": { label: "Open in Typeform", type: "other" },
  "loom.com": { label: "Watch on Loom", type: "access" },
  "gumroad.com": { label: "Access content", type: "other" },
};

function getHost(url: string): string | null {
  try {
    return new URL(url.trim()).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Returns the CTA label for the unlock button, e.g. "Open in Notion →" */
export function getPlatformLabel(url: string): string {
  const host = getHost(url);
  return host ? (HOST_MAP[host]?.label ?? "Access content") : "Access content";
}

/** Auto-detects product type from URL — used silently server-side only. */
export function detectProductType(url: string): ProductType | null {
  const host = getHost(url);
  return host ? (HOST_MAP[host]?.type ?? null) : null;
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
