import { Building2, CreditCard, Lock } from "lucide-react";

function SolanaDiamond() {
  return (
    <svg
      viewBox="0 0 110 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[18px] w-auto shrink-0"
    >
      <defs>
        <linearGradient id="sol-bar-grad" x1="10.81" y1="98.29" x2="98.89" y2="-1.01" gradientUnits="userSpaceOnUse">
          <stop offset="0.08" stopColor="#9945FF" />
          <stop offset="0.3" stopColor="#8752F3" />
          <stop offset="0.5" stopColor="#5497D5" />
          <stop offset="0.6" stopColor="#43B4CA" />
          <stop offset="0.72" stopColor="#28E0B9" />
          <stop offset="0.97" stopColor="#19FB9B" />
        </linearGradient>
      </defs>
      <path d="M108.53 75.69L90.81 94.69C90.43 95.1 89.96 95.43 89.45 95.66C88.93 95.88 88.37 96 87.81 96H3.81C3.41 96 3.02 95.88 2.68 95.66C2.35 95.44 2.08 95.13 1.92 94.76C1.76 94.4 1.71 93.99 1.78 93.6C1.85 93.2 2.03 92.83 2.3 92.54L20 73.54C20.38 73.13 20.85 72.8 21.36 72.57C21.88 72.35 22.44 72.23 23 72.23H107C107.4 72.22 107.8 72.33 108.14 72.55C108.48 72.77 108.75 73.08 108.92 73.45C109.08 73.82 109.13 74.23 109.06 74.63C108.99 75.03 108.81 75.39 108.53 75.69ZM90.81 37.42C90.43 37.01 89.96 36.68 89.45 36.46C88.93 36.23 88.37 36.11 87.81 36.11H3.81C3.41 36.11 3.02 36.23 2.68 36.45C2.35 36.67 2.08 36.98 1.92 37.35C1.76 37.71 1.71 38.12 1.78 38.51C1.85 38.91 2.03 39.28 2.3 39.57L20 58.58C20.38 58.99 20.85 59.32 21.36 59.54C21.88 59.77 22.44 59.89 23 59.89H107C107.4 59.89 107.79 59.77 108.12 59.55C108.46 59.33 108.72 59.02 108.88 58.65C109.04 58.28 109.09 57.88 109.02 57.48C108.95 57.09 108.77 56.72 108.5 56.43L90.81 37.42ZM3.81 23.77H87.81C88.37 23.77 88.93 23.65 89.45 23.43C89.96 23.2 90.43 22.87 90.81 22.46L108.53 3.46C108.81 3.17 108.99 2.8 109.06 2.4C109.13 2 109.08 1.59 108.92 1.22C108.75 0.85 108.48 0.54 108.14 0.32C107.8 0.1 107.4 -0.01 107 0H23C22.44 0 21.88 0.12 21.36 0.34C20.85 0.57 20.38 0.9 20 1.31L2.3 20.31C2.03 20.6 1.85 20.97 1.78 21.37C1.71 21.76 1.76 22.17 1.92 22.53C2.08 22.9 2.35 23.21 2.68 23.43C3.02 23.65 3.41 23.77 3.81 23.77Z" fill="url(#sol-bar-grad)" />
    </svg>
  );
}

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

      {/* Powered by Solana badge */}
      <span className="inline-flex items-center gap-1.5 shrink-0 px-6 sm:px-0">
        <span className="text-xs text-muted-foreground">Powered by</span>
        <SolanaDiamond />
        <span className="text-xs font-medium text-foreground">Solana</span>
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
