import { Check } from "lucide-react";

const DEFAULT_ITEMS: React.ReactNode[] = [
  <>Payments by <span className="font-semibold" style={{ color: "#635BFF" }}>Stripe</span></>,
  "4.5% per sale — half of Gumroad",
  "No file uploads ever",
  "No $100 payout minimum",
  "Access delivered in under 30 seconds",
  "Cancel any time",
];

export function TrustBar({ items = DEFAULT_ITEMS }: { items?: React.ReactNode[] }) {
  return (
    <div className="grid grid-cols-2 md:flex md:flex-wrap gap-x-6 gap-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Check className="size-3 shrink-0 text-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">{item}</span>
        </div>
      ))}
    </div>
  );
}
