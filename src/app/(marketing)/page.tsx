import { TrustBar } from "@unseallink/components/trust-bar";
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Globe, Lock, Mail, Percent, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ProductScroll = dynamic(() =>
  import("./product-scroll").then((m) => m.ProductScroll)
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export const metadata: Metadata = {
  title: "unseal.link: Sell Any URL Behind a Paywall. 4.5% Fee.",
  description:
    "Paste any URL, set a price, share a paywall link. Buyers pay via Stripe and get instant access. 4.5% fee, half of Gumroad. No uploads, no payout minimum.",
  alternates: { canonical: APP_URL },
  openGraph: {
    title: "unseal.link: Sell Any URL in 60 Seconds",
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
    body: "Notion, Figma, Google Drive, GitHub, Discord. Any URL you already own. No file uploads. Your content stays where it lives.",
  },
  {
    n: "02",
    title: "Set a price",
    body: "Minimum $9.99. When you're ready to get paid, we create your payment account automatically in 2 minutes — no Stripe account needed to start. No payout minimum. No weekly batch.",
  },
  {
    n: "03",
    title: "Share the paywall",
    body: "Buyers pay via Stripe and get instant access on the confirmation page. No account required.",
  },
];

const features: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: Globe,
    title: "Works with any URL",
    body: "Notion, Figma, Canva, Google Drive, GitHub, Discord, Dropbox, Loom. If it has a link, you can sell it. No file uploads ever.",
  },
  {
    Icon: Percent,
    title: "Lowest fee. No surprises.",
    body: "No monthly costs. No payout minimum. No hidden fees. Half the cut of Gumroad. Money lands directly in your Stripe account per sale.",
  },
  {
    Icon: Lock,
    title: "Buyers pay before they get anything",
    body: "Your link is never exposed until Stripe confirms payment. No more delivering first and hoping. Ghosting is structurally impossible.",
  },
  {
    Icon: Mail,
    title: "Instant access to every buyer",
    body: "Buyer pays → Stripe confirms → buyer gets instant access. No manual work. No follow-up. Done.",
  },
  {
    Icon: Share2,
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
    hook: "You drove all your own traffic. Gumroad still takes 10%.",
    body: "When you're posting on X and Pinterest to drive every single sale yourself, paying a discovery tax to a platform that discovered nothing makes no sense.\n\nLowest fee. No minimum. No storefront. Just your link.",
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
    body: "A Discord invite link is just a URL. Paste it, set a price, share the paywall link. No Whop account. No role-sync bot. No monthly software fee.\n\nHonest note: unseal.link is built for one-time and lifetime access, not recurring subscriptions. If you need monthly billing with role-sync, Whop or Memberful are better fits. But lifetime access at $49 converts better than you'd think. Members who paid once feel ownership, not obligation. The churn problem disappears entirely.",
  },
];

const comparisonRows = [
  {
    feature: "Platform fee",
    us: "4.5%",
    gumroadDirect: "10% + $0.50",
    gumroadDiscover: "30%",
    lemon: "5% + $0.50",
  },
  {
    feature: "Payout minimum",
    us: "$0",
    gumroadDirect: "$10",
    gumroadDiscover: "$10",
    lemon: "$50",
  },
  {
    feature: "Fee on refund",
    us: "Returned",
    gumroadDirect: "Gumroad keeps it",
    gumroadDiscover: "Gumroad keeps it",
    lemon: "Kept",
  },
  {
    feature: "File upload required",
    us: "No",
    gumroadDirect: "Yes",
    gumroadDiscover: "Yes",
    lemon: "Yes",
  },
  {
    feature: "Payout speed",
    us: "Instant (Stripe)",
    gumroadDirect: "Weekly",
    gumroadDiscover: "Weekly",
    lemon: "Bi-weekly",
  },
  {
    feature: "Storefront required",
    us: "No",
    gumroadDirect: "Yes",
    gumroadDiscover: "Yes",
    lemon: "Yes",
  },
];

const notRightFor = [
  {
    title: "You need recurring subscriptions",
    body: "unseal.link handles one-time and lifetime access payments. For monthly/annual billing with automatic renewals, use Whop, Memberful, or Patreon.",
  },
  {
    title: "You need marketplace discovery",
    body: "We don't have a browsable marketplace. You bring the audience. If you're starting from zero followers and need organic discovery, Gumroad or Payhip have marketplace traffic worth paying their fees for.",
  },
  {
    title: "You're selling physical goods",
    body: "unseal.link is built for digital content delivery. Physical products need shipping, inventory, and returns. Use Shopify.",
  },
  {
    title: "You need VAT/GST handled automatically",
    body: "We process payments via Stripe Connect. For automatic global tax handling as a Merchant of Record, Lemon Squeezy or Paddle are purpose-built for that.",
  },
];

const faqItems = [
  {
    q: "Why not just use Stripe Payment Links?",
    a: "Stripe Payment Links handles the payment. It doesn't handle the delivery.\n\nAfter a Stripe Payment Link completes, your buyer gets a receipt. You still need to manually email them your Notion link, add them to your GitHub repo, send them the Figma file, or paste them the Discord invite.\n\nunseal.link does the part Stripe doesn't: it gates your content URL behind the payment and delivers it automatically the moment Stripe confirms, without you doing anything.\n\nStripe Payment Links also requires you to create a product, configure pricing, set up redirects, and handle fulfillment. unseal.link is paste, price, share. The whole thing takes 60 seconds.\n\nIf you're selling a simple download you've already uploaded somewhere, Stripe Payment Links is fine. If you're selling access to a live URL: a Notion page, a Figma file, a GitHub repo, a Discord server. unseal.link is the missing layer.",
  },
  {
    q: "How does unseal.link keep my content URL private?",
    a: "Your URL never appears in the page HTML, JavaScript, or network requests of your paywall page.\n\n1. Buyer opens your unseal.link and sees product name, price, Stripe checkout. Your content URL: not present anywhere.\n2. Buyer pays. Stripe processes the charge.\n3. Stripe fires a signed webhook to our server. We verify the signature cryptographically.\n4. Only after verification: your content URL is unlocked for that buyer. They get instant access on the confirmation page, and a backup link by email.\n5. Buyer clicks through. You get notified. Done.\n\nView-source won't reveal your URL. Network inspection won't reveal your URL. The only way to get it is to pay.",
  },
  {
    q: "What's the minimum payout?",
    a: "$0. Every sale pays out directly to your connected Stripe account. No weekly batch. No $10 threshold like Gumroad. Your first sale pays out immediately.",
  },
  {
    q: "Can I use unseal.link alongside Gumroad?",
    a: "Yes. Run both. Use unseal.link for new products and your own audience, keep Gumroad where you have existing customers.",
  },
  {
    q: "What's my actual take-home on a $50 sale?",
    a: "On a $50 sale: unseal.link takes $2.25 (4.5%). Stripe takes approximately $1.75 (2.9% + $0.30). You keep about $46.\n\nGumroad (direct) takes $5 (10%) on the same sale, leaving you about $43. Gumroad Discover takes $15 (30%), leaving you about $33.\n\nEvery sale pays out directly to your connected Stripe account. No weekly batch. No minimum balance. Your first sale pays out immediately.",
  },
  {
    q: "Do buyers need an account to purchase?",
    a: "No. Buyers click your paywall link, enter their email and card in Stripe Checkout, and get instant access on the confirmation page. That's the entire flow.\n\nNo account creation. No password. No profile. The buyer experience is frictionless by design: just a payment and a click.",
  },
  {
    q: "Can I update my content URL after publishing?",
    a: "Yes. You can edit your link's destination URL at any time from your dashboard.\n\nBuyers who already purchased received a snapshot of the URL at the time of their purchase. If you've made a significant update, you can resend access to existing buyers from the link detail page. They'll get a fresh access link with the current URL.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "unseal.link",
  applicationCategory: "BusinessApplication",
  url: APP_URL,
  description:
    "Turn any URL into a paid link in 60 seconds. 4.5% fee, no uploads, no storefront, no payout minimum.",
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
    sameAs: [
      "https://twitter.com/unseallink",
      "https://x.com/unseallink",
      // Add after launch: "https://www.producthunt.com/products/unseal-link"
      // Add after launch: "https://www.reddit.com/r/unseallink" (if created)
    ],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a.replace(/\n\n/g, " "),
    },
  })),
};

export default function HomePage() {
  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-20 px-6 max-w-5xl mx-auto relative overflow-hidden">
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-16 lg:items-start">

          {/* Left: copy + CTAs */}
          <div>
            <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-foreground mb-6 leading-[1.1]">
              No uploads.
              <br />
              No 10% tax.
              <br />
              No ghosting.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Paste any URL, set a price, share your paywall link.{" "}
              <br className="hidden sm:block" />
              Buyers pay via Stripe and get instant access.
            </p>

            <div className="flex flex-wrap gap-3 mb-3">
              <Link
                href="/auth"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:opacity-90 transition-opacity no-underline"
              >
                Create your first paid link →
              </Link>
            </div>

            <p className="text-xs text-muted-foreground mb-10">
              Fee-free for first 100 sellers.{" "}
              <Link href="/auth" className="text-foreground underline hover:no-underline">
                Claim your spot →
              </Link>
            </p>

            <TrustBar />
          </div>

          {/* Right: paywall card mockup — desktop only */}
          <div className="hidden lg:block lg:pt-4 relative">
            {/* Atmosphere rings radiating from behind the card */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: "24px" }}>
              <div className="absolute w-[560px] h-[560px] rounded-full border border-border/[0.13] animate-pulse" style={{ animationDuration: "5s" }} />
              <div className="absolute w-[420px] h-[420px] rounded-full border border-border/[0.18]" />
              <div className="absolute w-[290px] h-[290px] rounded-full border border-border/[0.22] animate-pulse" style={{ animationDuration: "3s", animationDelay: "0.8s" }} />
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden relative">
              {/* Preview area — rings signal locked content */}
              <div className="h-44 bg-muted/20 border-b border-border flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute w-52 h-52 rounded-full border border-border/25 animate-pulse" style={{ animationDuration: "3.5s" }} />
                  <div className="absolute w-36 h-36 rounded-full border border-border/35" />
                  <div className="absolute w-20 h-20 rounded-full border border-border/45" />
                </div>
                <Lock className="size-5 text-muted-foreground/50 relative z-10" />
              </div>

              {/* Product details — kept abstract */}
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">@alexdesign</p>
                  <p className="font-medium text-foreground leading-snug">
                    Figma UI Kit 2024
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-medium text-foreground tracking-tight">$49</span>
                  <span className="text-xs text-muted-foreground">+ Stripe fees</span>
                </div>
                <div className="space-y-2.5">
                  <div className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium text-center select-none">
                    Pay via Stripe →
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Instant access after payment
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
              Your content URL never appears in page source
            </p>
          </div>

        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="border-t border-border py-16 md:py-20 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12">
            How it works
          </p>
          <div className="grid sm:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.n} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -top-3 -left-1 text-[88px] font-medium leading-none select-none pointer-events-none text-foreground/[0.05]"
                >
                  {step.n}
                </span>
                <span className="relative text-xs font-medium text-muted-foreground font-mono">
                  {step.n}
                </span>
                <h3 className="relative text-lg font-medium mt-3 mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you can sell ────────────────────────────────────────── */}
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

      {/* ── Features ─────────────────────────────────────────────────── */}
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
                <div className="size-9 rounded-xl bg-muted/60 flex items-center justify-center mb-4">
                  <f.Icon className="size-4 text-muted-foreground" />
                </div>
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

      {/* ── Security / delivery proof ────────────────────────────────── */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
              How delivery works
            </p>
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground mb-8">
              Your content stays private
              <br />
              until payment confirms.
            </h2>
            <ol className="space-y-4">
              {[
                "Buyer opens your unseal.link and sees product name, price, Stripe checkout. Your content URL: not present anywhere.",
                "Buyer pays. Stripe processes the charge.",
                "Stripe fires a signed webhook to our server. We verify the signature cryptographically.",
                "Only after verification: your content URL is unlocked. Buyer gets instant access on the confirmation page plus a backup link by email.",
                "Buyer clicks through. You get notified. Done.",
              ].map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="text-xs font-mono font-medium text-muted-foreground mt-0.5 shrink-0 w-5">
                    {i + 1}.
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground mt-6 border-t border-border pt-6">
              View-source won't reveal your URL. Network inspection won't reveal
              your URL. The only way to get it is to pay.
            </p>
          </div>
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────── */}
      <section className="border-t border-border py-16 md:py-24 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12">
            Who it's for
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {useCases.map((uc, i) => (
              <div
                key={uc.audience}
                className={`border border-border rounded-2xl p-6 bg-card flex flex-col gap-3${i === useCases.length - 1 && useCases.length % 2 !== 0 ? " sm:col-span-2" : ""}`}
              >
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {uc.audience}
                </p>
                <p className="font-medium text-foreground text-sm leading-snug">
                  {uc.hook}
                </p>
                {uc.body.split("\n\n").map((para) => (
                  <p
                    key={para}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    {para}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {/* Freelancer math callout */}
          <div className="mt-6 border-l-2 border-emerald-500 pl-5 max-w-xl">
            <p className="text-sm font-medium text-foreground mb-2">
              For freelancers: the math on ghosting
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              If you're doing $2,000 projects and get ghosted on final payment
              twice a year, that's $4,000 in lost revenue.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              unseal.link's fee on a $2,000 project: $90.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The files don't exist from the client's perspective until Stripe
              confirms. There's nothing to ghost on.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="border-t border-border py-16 md:py-24">
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

          {/* Take-home breakdown — platform fee only, same Stripe fees apply everywhere */}
          <div className="border border-border rounded-2xl overflow-hidden max-w-2xl mb-6 bg-card">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                What you actually keep (platform fee only)
              </p>
            </div>
            <div className="divide-y divide-border">
              {[
                { sale: "$20 sale", us: "$19.10", gumroad: "$18.00", discover: "$14.00" },
                { sale: "$50 sale", us: "$47.75", gumroad: "$45.00", discover: "$35.00" },
                { sale: "$100 sale", us: "$95.50", gumroad: "$90.00", discover: "$70.00" },
              ].map((row) => (
                <div key={row.sale} className="grid grid-cols-4 items-center px-5 py-3 text-xs gap-2">
                  <span className="text-muted-foreground">{row.sale}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{row.us}</span>
                  <span className="text-muted-foreground">{row.gumroad}</span>
                  <span className="text-muted-foreground">{row.discover}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 px-5 py-3 border-t border-border bg-muted/30 text-xs font-medium text-muted-foreground">
              <span />
              <span className="text-foreground">unseal.link</span>
              <span>Gumroad</span>
              <span>Gumroad Disc.</span>
            </div>
            <p className="px-5 py-3 text-xs text-muted-foreground border-t border-border">
              Stripe fees (~2.9% + $0.30) are identical on all platforms and not included above.
            </p>
          </div>

          <div className="border border-border rounded-2xl p-6 space-y-3 max-w-2xl bg-card">
            <p className="text-sm font-semibold text-foreground">
              The Gumroad math nobody talks about
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gumroad's Discover marketplace charges 30%, not 10%. If Gumroad
              sends you a customer through their marketplace, they take nearly a
              third of your sale.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              They also keep their fee when you refund a customer. You lose the
              product and pay the platform fee.
            </p>
            <p className="text-sm font-medium text-foreground">
              With unseal.link: on refunds you get the fee back. Minimum payout: $0.
              First sale pays out immediately.
            </p>
          </div>
        </div>
      </section>

      {/* ── When we're not the right tool ────────────────────────────── */}
      <section className="border-t border-border py-16 md:py-24 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
              Honest limits
            </p>
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground mb-8">
              When unseal.link isn't
              <br />
              the right tool
            </h2>
            <div className="space-y-6">
              {notRightFor.map((item) => (
                <div key={item.title}>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-8 pt-6 border-t border-border">
              If none of these apply to you: you're in the right place.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12">
            FAQ
          </p>
          <div className="max-w-2xl space-y-0 divide-y divide-border border-y border-border">
            {faqItems.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer select-none list-none gap-4">
                  <span className="text-sm font-medium text-foreground">
                    {item.q}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-lg leading-none group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="mt-4 space-y-3">
                  {item.a.split("\n\n").map((para) => (
                    <p
                      key={para}
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="border-t border-border py-24 px-6 text-center relative overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[940px] h-[940px] rounded-full border border-border/[0.12] animate-pulse" style={{ animationDuration: "5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full border border-border/[0.18]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-border/[0.25]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-border/[0.32] animate-pulse" style={{ animationDuration: "3.5s", animationDelay: "0.6s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[190px] h-[190px] rounded-full border border-border/[0.40]" />
        </div>
        <h2 className="relative text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-4">
          Stop delivering first.
        </h2>
        <p className="relative text-muted-foreground mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Paste your link, set a price, and your first paywall is live in under
          60 seconds. No storefront. No uploads. No payout minimum.
        </p>
        <Link
          href="/auth"
          className="relative inline-flex items-center px-7 py-3.5 bg-primary text-primary-foreground rounded-full font-medium text-base hover:opacity-90 transition-opacity no-underline"
        >
          Create your first paid link →
        </Link>
        <p className="relative mt-4 text-xs text-muted-foreground">
          Free to list. 4.5% per sale. First $500 fee-free for new sellers.
        </p>
      </section>

      {/* ── Internal links ───────────────────────────────────────────── */}
      <section className="py-12 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6 text-center">Guides & use cases</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {[
              { href: "/sell-link-online", label: "Sell any link online" },
              { href: "/sell-notion-template", label: "Sell Notion templates" },
              { href: "/sell-figma-template", label: "Sell Figma files" },
              { href: "/sell-google-drive-files", label: "Sell Google Drive files" },
              { href: "/sell-discord-access", label: "Sell Discord access" },
              { href: "/sell-github-repo", label: "Sell GitHub repos" },
              { href: "/sell-ai-prompts", label: "Sell AI prompts" },
              { href: "/get-paid-before-delivering-freelance-work", label: "Get paid before delivering" },
              { href: "/how-to-paywall-any-link", label: "How to paywall any link" },
              { href: "/what-is-a-paywall-link", label: "What is a paywall link?" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
