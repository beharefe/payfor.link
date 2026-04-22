import Link from "next/link";

const USE_CASES = [
  { href: "/notion",    label: "Notion Templates" },
  { href: "/figma",     label: "Figma Files" },
  { href: "/discord",   label: "Discord Access" },
  { href: "/freelance", label: "Freelancers" },
  { href: "/github",    label: "GitHub Repos" },
  { href: "/gumroad-alternatives-lower-fees", label: "Gumroad Alternatives" },
];

const COMPARE = [
  { href: "/vs-gumroad",                            label: "vs Gumroad" },
  { href: "/vs-lemon-squeezy",                      label: "vs Lemon Squeezy" },
  { href: "/vs-stan-store",                         label: "vs Stan Store" },
  { href: "/vs-ko-fi",                              label: "vs Ko-fi" },
  { href: "/vs-whop",                               label: "vs Whop" },
  { href: "/gumroad-alternatives-lower-fees",       label: "Gumroad Alternatives" },
];

const LEGAL = [
  { href: "/terms",   label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/about",   label: "About" },
];

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">

          {/* Brand */}
          <div className="flex flex-col gap-2 sm:flex-1">
            <span className="text-sm font-medium text-foreground">unseal.link</span>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Turn any link into a paywall. Buyers pay via Stripe and unlock
              access instantly. No uploads. No storefront. No minimum payout.
            </p>
            <span className="text-xs text-muted-foreground mt-1">
              © {new Date().getFullYear()} unseal.link · Payments by{" "}
              <span className="font-semibold" style={{ color: "#635BFF" }}>Stripe</span>
            </span>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 shrink-0">

            {/* Use cases */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Sell
              </p>
              {USE_CASES.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Compare */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Compare
              </p>
              {COMPARE.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Company
              </p>
              {LEGAL.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
                >
                  {label}
                </Link>
              ))}
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
