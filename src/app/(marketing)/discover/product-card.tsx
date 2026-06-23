"use client";

import { track } from "@unseallink/lib/amplitude";
import Image from "next/image";
import Link from "next/link";

const PLATFORM_LABEL: Record<string, string> = {
  notion: "Notion",
  figma: "Figma",
  canva: "Canva",
  airtable: "Airtable",
  github: "GitHub",
  gitlab: "GitLab",
  google_drive: "Google Drive",
  google_docs: "Google Docs",
  google_sheets: "Google Sheets",
  google_slides: "Google Slides",
  loom: "Loom",
  typeform: "Typeform",
  dropbox: "Dropbox",
  discord: "Discord",
  substack: "Substack",
  beehiiv: "Beehiiv",
  framer: "Framer",
  webflow: "Webflow",
};

const PLATFORM_EMOJI: Record<string, string> = {
  notion: "📄",
  figma: "🎨",
  github: "💻",
  canva: "✏️",
  airtable: "📊",
  google_drive: "📁",
  google_docs: "📝",
  loom: "🎬",
  discord: "💬",
};

type Props = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number;
  preview_image_url: string | null;
  destination_platform: string | null;
  sellerUsername: string | null;
  position: number;
};

export function DiscoverProductCard({
  id,
  title,
  description,
  slug,
  price,
  preview_image_url,
  destination_platform,
  sellerUsername,
  position,
}: Props) {
  const platform = destination_platform;
  const platformLabel = platform ? (PLATFORM_LABEL[platform] ?? null) : null;
  const platformEmoji = platform ? (PLATFORM_EMOJI[platform] ?? "🔗") : "🔗";
  const payUrl = `/@${sellerUsername}/${slug}`;

  return (
    <Link
      href={payUrl}
      onClick={() =>
        track({
          name: "Discover Product Clicked",
          props: { link_id: id, platform, price, position },
        })
      }
      className="group block border border-border rounded-2xl overflow-hidden bg-card no-underline hover:border-foreground/30 transition-colors"
    >
      {preview_image_url ? (
        <div className="relative w-full aspect-[1.91/1] bg-muted overflow-hidden">
          <Image
            src={preview_image_url}
            alt={title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="w-full aspect-[1.91/1] bg-muted flex items-center justify-center">
          <span className="text-3xl opacity-40">{platformEmoji}</span>
        </div>
      )}

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {platformLabel && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {platformLabel}
            </span>
          )}
          <span
            className="text-xs text-muted-foreground ml-auto"
            title="This listing was reviewed against unseal's public listing guidelines. Content is provided by the seller."
          >
            Reviewed listing
          </span>
        </div>

        <p className="font-medium text-foreground leading-snug group-hover:text-foreground/80 transition-colors line-clamp-2">
          {title}
        </p>

        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="font-medium text-foreground text-sm">
            ${price.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            by @{sellerUsername}
          </span>
        </div>
      </div>
    </Link>
  );
}
