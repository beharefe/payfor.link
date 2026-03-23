import type { ProductType } from "@unseallink/types/database";

const HOST_TO_TYPE: Record<string, ProductType> = {
  "notion.so": "template",
  "notion.site": "template",
  "www.notion.so": "template",
  "www.notion.site": "template",
  "figma.com": "template",
  "www.figma.com": "template",
  "docs.google.com": "template",
  "drive.google.com": "file",
  "sheets.google.com": "template",
  "github.com": "other",
  "www.github.com": "other",
  "canva.com": "template",
  "www.canva.com": "template",
};

export function detectProductType(destinationUrl: string): ProductType | null {
  try {
    const host = new URL(destinationUrl.trim()).hostname.toLowerCase().replace(/^www\./, "");
    const withWww = `www.${host}`;
    return HOST_TO_TYPE[host] ?? HOST_TO_TYPE[withWww] ?? null;
  } catch {
    return null;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
