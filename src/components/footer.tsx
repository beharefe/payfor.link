import Link from "next/link";

const USE_CASES = [
  { href: "/sell-notion-template",                   label: "Sell Notion Templates" },
  { href: "/sell-figma-template",                    label: "Sell Figma Files" },
  { href: "/sell-access-discord-server",             label: "Sell Discord Access" },
  { href: "/get-paid-before-delivering-freelance-work", label: "Freelancers" },
  { href: "/sell-github-repo-code-boilerplate",      label: "Sell GitHub Repos" },
  { href: "/sell-google-drive-file-folder",          label: "Sell Google Drive Files" },
  { href: "/gumroad-alternatives-lower-fees",        label: "Gumroad Alternatives" },
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
        <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto] gap-8 sm:gap-12">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">unseal.link</span>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Turn any link into a paywall. Buyers pay via Stripe and get instant
              access by email. No uploads. No storefront. No minimum payout.
            </p>
            <span className="text-xs text-muted-foreground mt-1">
              © {new Date().getFullYear()} unseal.link · Payments by{" "}
              <span className="font-semibold" style={{ color: "#635BFF" }}>Stripe</span>
            </span>
          </div>

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
    </footer>
  );
}
