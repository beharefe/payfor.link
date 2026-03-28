"use client";

import { useState } from "react";

const sellerSteps = [
  {
    n: "01",
    title: "Create an account",
    body: "Sign in with your email. No password. A magic link lands in your inbox.",
  },
  {
    n: "02",
    title: "Paste your link and set a price",
    body: "Any URL works: Notion, Figma, Google Drive, GitHub, Discord invite, anything.",
  },
  {
    n: "03",
    title: "Connect Stripe to receive payouts",
    body: "Takes about 2 minutes. Stripe handles identity verification and bank payouts.",
  },
  {
    n: "04",
    title: "Share your paywall link anywhere",
    body: "Post it on Twitter, Discord, email, or wherever your audience is.",
  },
];

const buyerSteps = [
  { n: "01", title: "Open the link", body: "See the product title, description, and price." },
  { n: "02", title: "Pay via Stripe", body: "Card, Apple Pay, or Google Pay. Secure checkout." },
  { n: "03", title: "Check your email", body: "Your access link arrives within 30 seconds." },
  { n: "04", title: "Click unlock", body: "One click. Access the content instantly." },
];

const TABS = [
  { id: "sellers", label: "For sellers", steps: sellerSteps },
  { id: "buyers",  label: "For buyers",  steps: buyerSteps  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function StepsTabs() {
  const [active, setActive] = useState<TabId>("sellers");
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <div>
      {/* Pill tabs */}
      <div className="flex items-center gap-1 mb-10">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer border-none ${
              active === id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted bg-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="divide-y divide-border">
        {tab.steps.map((step) => (
          <div key={step.n} className="flex gap-6 py-6">
            <span className="text-xs font-medium text-muted-foreground font-mono min-w-[2rem] mt-0.5 tabular-nums">
              {step.n}
            </span>
            <div>
              <p className="font-medium text-foreground mb-1">{step.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
