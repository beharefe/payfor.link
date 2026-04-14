import type { Metadata } from "next";
import Link from "next/link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";
const OG_TITLE = "About unseal.link";

export const metadata: Metadata = {
  title: { absolute: "About · unseal.link" },
  description:
    "unseal.link is payment-gated delivery for anything that lives online. Not a storefront, not a marketplace, not a file host.",
  robots: { index: true, follow: true },
  openGraph: {
    title: OG_TITLE,
    description:
      "unseal.link is payment-gated delivery for anything that lives online. Not a storefront, not a marketplace, not a file host.",
    url: `${APP_URL}/about`,
    siteName: "unseal.link",
    type: "website",
    images: [
      {
        url: `${APP_URL}/api/og?title=${encodeURIComponent(OG_TITLE)}`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description:
      "unseal.link is payment-gated delivery for anything that lives online. Not a storefront, not a marketplace, not a file host.",
    images: [`${APP_URL}/api/og?title=${encodeURIComponent(OG_TITLE)}`],
  },
};

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-10">
        About
      </p>

      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground leading-snug">
          unseal.link is payment-gated delivery for anything that lives online.
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed">
          Not a storefront. Not a marketplace. Not a file host.
        </p>

        <p className="text-base text-muted-foreground leading-relaxed">
          It's the missing layer between "I have a URL" and "I want to charge
          for it, without rebuilding your entire workflow around a new
          platform."
        </p>

        <p className="text-base text-muted-foreground leading-relaxed">
          Stripe collects payments. Your existing tools host the content.
          unseal.link connects the two in 60 seconds.
        </p>
      </div>

      <div className="mt-16 pt-10 border-t border-border space-y-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          The idea
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Thousands of people have a Notion template, a Figma file, a GitHub
          repo, or a Discord community they want to charge for. The existing
          options (Gumroad, Payhip, Lemon Squeezy) are built around file
          uploads and storefronts. You have to move your content onto their
          platform, design a product page, and pay 10% for infrastructure you
          don't need.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Stripe Payment Links handles the payment but not the delivery. You
          still send the file manually. Ghosting still happens.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          unseal.link is the third option: paste the URL where your content
          already lives, set a price, and the delivery is automatic. Your
          content doesn't move. Your workflow doesn't change. The link just
          requires payment first.
        </p>
      </div>

      <div className="mt-16 pt-10 border-t border-border space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          The fee
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          4.5% per sale. No monthly fee. No payout minimum.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Gumroad charges 10% + $0.50. We charge 4.5%. On $10,000 in sales,
          that's $550 more in your pocket.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We earn only when you earn. That's the right incentive structure.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/auth"
          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:opacity-90 transition-opacity no-underline"
        >
          Create your first paid link →
        </Link>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 border border-border rounded-full font-medium text-sm text-foreground hover:bg-muted transition-colors no-underline"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
