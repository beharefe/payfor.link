import { Building2, Lock, CreditCard } from "lucide-react";

export function CredibilityBar() {
  return (
    <section className="border-t border-b border-border bg-card">
      <div className="max-w-5xl mx-auto px-6 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-10">

          {/* Powered by Stripe badge — blurple for light, white for dark */}
          {/* biome-ignore lint/a11y/useAltText: decorative partner badge */}
          <img
            src="/stripe/powered-by-stripe-blurple.svg"
            alt="Powered by Stripe"
            className="dark:hidden h-[26px] w-auto"
          />
          {/* biome-ignore lint/a11y/useAltText: decorative partner badge */}
          <img
            src="/stripe/powered-by-stripe-white.svg"
            alt="Powered by Stripe"
            className="hidden dark:block h-[26px] w-auto"
          />

          <div className="hidden sm:block w-px h-4 bg-border shrink-0" />

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CreditCard className="size-3.5 shrink-0" />
            <span>Sellers paid via Stripe Connect</span>
          </div>

          <div className="hidden sm:block w-px h-4 bg-border shrink-0" />

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5 shrink-0" />
            <span>Delaware C-Corp</span>
          </div>

          <div className="hidden sm:block w-px h-4 bg-border shrink-0" />

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5 shrink-0" />
            <span>Content URL hidden until payment</span>
          </div>

        </div>
      </div>
    </section>
  );
}
