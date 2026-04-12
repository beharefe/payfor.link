import { TrustBar } from "@unseallink/components/trust-bar";
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";

const ProductScroll = dynamic(() =>
  import("./product-scroll").then((m) => m.ProductScroll)
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export const metadata: Metadata = {
  title: "unseal.link — Sell Any URL. 4.5% Fee. No Uploads. No $100 Minimum.",
  description:
    "Turn any Notion, Figma, Drive, GitHub, or Discord URL into a paid link in 60 seconds. Buyers pay via Stripe before they get access. 4.5% fee — half of Gumroad. No file uploads, no storefront, no $100 payout minimum.",
  alternates: { canonical: APP_URL },
  openGraph: {
    title: "unseal.link — Sell Any URL in 60 Seconds",
    description:
      "No uploads. No 10% tax. No ghosting. Paste your URL, set a price, get paid first. 4.5% fee, no minimums.",
    url: APP_URL,
    siteName: "unseal.link",
    type: "website",
    images: [{ url: `${APP_URL}/api/og`, width: 1200, height: 630 }],
  },
};

const steps = [
  {
    n: "01",
    title: "Paste any link",
    body: "Notion, Figma, Google Drive, GitHub, Discord — any URL you already own. No file uploads. Your content stays where it lives.",
  },
  {
    n: "02",
    title: "Set a price",
    body: "Minimum $9.99. Connect Stripe once and every payout lands directly in your bank. No $100 minimum. No weekly batch.",
  },
  {
    n: "03",
    title: "Get paid first",
    body: "Buyers pay via Stripe and receive the link by email in under 30 seconds. Ghosting is structurally impossible.",
  },
];

const features = [
  {
    icon: "⚡",
    title: "Works with any URL",
    body: "Notion, Figma, Canva, Google Drive, GitHub, Discord, Dropbox, Loom — if it has a link, you can sell it. No file uploads ever.",
  },
  {
    icon: "💳",
    title: "4.5% fee. Nothing else.",
    body: "No monthly costs. No $100 payout minimum. No hidden fees. Money goes directly into your Stripe account per sale.",
  },
  {
    icon: "🔒",
    title: "Buyers pay before they get anything",
    body: "Your link is never exposed until Stripe confirms payment. No more delivering first and hoping. Ghosting is structurally impossible.",
  },
  {
    icon: "📬",
    title: "Access delivered in under 30 seconds",
    body: "Buyer pays → Stripe webhook fires → email with your link arrives. No manual work. No follow-up. Done.",
  },
  {
    icon: "🔗",
    title: "Previews everywhere automatically",
    body: "Share on X, Discord, Slack, WhatsApp, Telegram. Preview cards show your product name and price automatically.",
  },
];

const useCases = [
  {
    audience: "Figma Designers",
    hook: "Figma closed paid file submissions to new creators.",
    body: "If you've tried to list a UI kit or icon set on Figma Community recently, you already know. The door is closed.\n\nPaste your Figma share link. Set a price. Your buyers get access. No Figma approval needed.",
  },
  {
    audience: "Notion Template Creators",
    hook: 'You drove all your own traffic. Gumroad still takes 10%.',
    body: "When you're posting on X and Pinterest to drive every single sale yourself, paying a discovery tax to a platform that discovered nothing makes no sense.\n\n4.5%. No minimum. No storefront. Just your link.",
  },
  {
    audience: "Freelancers",
    hook: '"Client ghosted me after I sent the files."',
    body: "It happens every week. The work is done, the files are sent, and then: nothing.\n\nUpload your deliverable to Drive, Dropbox, or Figma. Paste the link. Your client pays before they get access. Ghosting becomes structurally impossible.",
  },
  {
    audience: "Developers",
    hook: "You built the boilerplate. Manual GitHub invites are not a product.",
    body: "Stop DMing people repo access after PayPal payments clear. Paste your release download or Drive zip. Buyer pays via Stripe → gets the link → you get notified.",
  },
  {
    audience: "Discord Community Owners",
    hook: "Bot setup hell is optional.",
    body: "A Discord invite link is just a URL. Paste it, set a price, share the paywall link. No Whop account. No role-sync bot. No monthly software fee.",
  },
];

const comparisonRows = [
  {
    feature: "Platform fee",
    us: "4.5%",
    gumroadDirect: "10% + $0.50",
    gumroadDiscover: "30%",
    lemon: "5% + $0.50",
    usWins: true,
  },
  {
    feature: "Payout minimum",
    us: "$0",
    gumroadDirect: "$100",
    gumroadDiscover: "$100",
    lemon: "$100",
    usWins: true,
  },
  {
    feature: "Fee on refund",
    us: "Returned",
    gumroadDirect: "Gumroad keeps it",
    gumroadDiscover: "Gumroad keeps it",
    lemon: "Kept",
    usWins: true,
  },
  {
    feature: "File upload required",
    us: "No",
    gumroadDirect: "Yes",
    gumroadDiscover: "Yes",
    lemon: "Yes",
    usWins: true,
  },
  {
    feature: "Payout speed",
    us: "Instant (Stripe)",
    gumroadDirect: "Weekly",
    gumroadDiscover: "Weekly",
    lemon: "Bi-weekly",
    usWins: true,
  },
  {
    feature: "Storefront required",
    us: "No",
    gumroadDirect: "Yes",
    gumroadDiscover: "Yes",
    lemon: "Yes",
    usWins: true,
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "unseal.link",
  applicationCategory: "BusinessApplication",
  url: APP_URL,
  description:
    "Turn any URL into a paid link in 60 seconds. 4.5% fee, no uploads, no storefront, no $100 payout minimum.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to list. 4.5% platform fee per sale.",
  },
  publisher: {
    "@type": "Organization",
    name: "unseal.link",
    url: APP_URL,
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="pt-20 pb-16 px-6 max-w-5xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            The paywall for any link
          </p>

          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-foreground mb-6 leading-[1.1]">
            No uploads.
            <br />
            No 10% tax.
            <br />
            No ghosting.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
            Turn any Notion, Figma, Drive, GitHub, or Discord URL into a paid
            link in 60 seconds. Buyers pay via Stripe before they get access.
            4.5% fee. No storefront. No file uploads.
          </p>

          <div className="flex flex-wrap gap-3 mb-5">
            <Link
              href="/auth"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:opacity-90 transition-opacity no-underline"
            >
              Create your first paid link →
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mb-10">
            First 100 sellers get their first $500 in sales fee-free — no
            platform cut, no Stripe fees.{" "}
            <Link href="/auth" className="text-foreground underline hover:no-underline">
              Claim your spot →
            </Link>
          </p>

          <TrustBar />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border py-16 md:py-20 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12">
            How it works
          </p>
          <div className="grid sm:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.n}>
                <span className="text-xs font-medium text-muted-foreground font-mono">
                  {step.n}
                </span>
                <h3 className="text-lg font-medium mt-3 mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you can sell */}
      <section className="border-t border-border py-14 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between px-6 mb-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                Sell anything with a URL
              </p>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                If it has a link, you can paywall it. No file uploads ever.
                Your content stays where it lives.
              </p>
            </div>
          </div>
          <ProductScroll />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-16 md:py-24 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12">
            Why it works
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="border border-border rounded-2xl p-6 bg-background"
              >
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="font-medium text-foreground mb-2 text-sm">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12">
            Who it's for
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {useCases.map((uc) => (
              <div
                key={uc.audience}
                className="border border-border rounded-2xl p-6 bg-card flex flex-col gap-3"
              >
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {uc.audience}
                </p>
                <p className="font-medium text-foreground text-sm leading-snug">
                  {uc.hook}
                </p>
                {uc.body.split("\n\n").map((para) => (
                  <p key={para} className="text-sm text-muted-foreground leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border py-16 md:py-24 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-3">
            Half the fee. No minimums.
            <br />
            No nasty surprises.
          </h2>
          <p className="text-sm text-muted-foreground mb-10">
            Stripe fees (~2.9% + $0.30) apply on all platforms separately.
          </p>

          {/* Comparison table */}
          <div className="overflow-x-auto -mx-6 px-6 mb-10">
            <table className="w-full min-w-[600px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-widest w-[30%]" />
                  <th className="py-3 px-3 text-center">
                    <span className="text-xs font-semibold text-foreground bg-primary/10 px-2 py-0.5 rounded-full">
                      unseal.link
                    </span>
                  </th>
                  <th className="py-3 px-3 text-center text-xs font-medium text-muted-foreground">
                    Gumroad (direct)
                  </th>
                  <th className="py-3 px-3 text-center text-xs font-medium text-muted-foreground">
                    Gumroad (Discover)
                  </th>
                  <th className="py-3 px-3 text-center text-xs font-medium text-muted-foreground">
                    Lemon Squeezy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonRows.map((row) => (
                  <tr key={row.feature}>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                      {row.feature}
                    </td>
                    <td className="py-3 px-3 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {row.us}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-muted-foreground">
                      {row.gumroadDirect}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-muted-foreground">
                      {row.gumroadDiscover}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-muted-foreground">
                      {row.lemon}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gumroad callout */}
          <div className="border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-6 space-y-3 max-w-2xl">
            <p className="text-sm font-semibold text-foreground">
              ⚠️ The Gumroad math nobody talks about
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gumroad's Discover marketplace charges 30% — not 10%. If Gumroad
              sends you a customer through their marketplace, they take nearly a
              third of your sale.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              They also keep their fee when you refund a customer. You lose the
              product AND pay the platform fee.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              And you can't withdraw anything until you've made $100. Your first
              $80 in sales? Held. Indefinitely.
            </p>
            <p className="text-sm font-medium text-foreground">
              unseal.link charges 4.5%. On refunds, you get it back. Minimum
              payout: $0. First sale pays out immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-4">
          Stop delivering first.
        </h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Paste your link, set a price, and your first paywall is live in under
          60 seconds. No storefront. No uploads. No $100 minimum.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center px-7 py-3.5 bg-primary text-primary-foreground rounded-full font-medium text-base hover:opacity-90 transition-opacity no-underline"
        >
          Create your first paid link →
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">
          Free to list. 4.5% per sale. First $500 fee-free for new sellers.
        </p>
      </section>
    </>
  );
}
