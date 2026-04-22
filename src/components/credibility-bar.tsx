import { Building2, CreditCard, Lock } from "lucide-react";

function Items() {
  return (
    <>
      {/* Powered by Stripe badge */}
      <span className="inline-flex items-center shrink-0 px-6 sm:px-0">
        <img
          src="/stripe/powered-by-stripe-blurple.svg"
          alt="Powered by Stripe"
          className="dark:hidden h-[26px] w-auto"
        />
        <img
          src="/stripe/powered-by-stripe-white.svg"
          alt="Powered by Stripe"
          className="hidden dark:block h-[26px] w-auto"
        />
      </span>

      <span className="w-px h-4 bg-border shrink-0 mx-2 sm:mx-0" aria-hidden />

      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 px-6 sm:px-0">
        <CreditCard className="size-3.5 shrink-0" />
        Sellers paid via Stripe Connect
      </span>

      <span className="w-px h-4 bg-border shrink-0 mx-2 sm:mx-0" aria-hidden />

      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 px-6 sm:px-0">
        <Building2 className="size-3.5 shrink-0" />
        Delaware C-Corp
      </span>

      <span className="w-px h-4 bg-border shrink-0 mx-2 sm:mx-0" aria-hidden />

      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 px-6 sm:px-0">
        <Lock className="size-3.5 shrink-0" />
        Content URL hidden until payment
      </span>
    </>
  );
}

export function CredibilityBar() {
  return (
    <section className="border-t border-b border-border bg-card">
      {/* Mobile: animated marquee */}
      <div className="sm:hidden overflow-hidden py-5">
        <div
          className="flex animate-marquee will-change-transform hover:[animation-play-state:paused]"
          aria-hidden="false"
        >
          {/* Duplicate for seamless loop */}
          <Items />
          <Items />
        </div>
      </div>

      {/* Desktop: static centered row */}
      <div className="hidden sm:flex items-center justify-center gap-x-8 lg:gap-x-10 max-w-5xl mx-auto px-6 py-5">
        <Items />
      </div>
    </section>
  );
}
