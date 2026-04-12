const DEFAULT_STATS = [
  { number: "Half the fee", label: "of Gumroad." },
  { number: "60 sec", label: "to your first paid link." },
  { number: "$0", label: "minimum payout." },
  { number: "Instant", label: "delivery to every buyer." },
];

export function TrustBar({ stats = DEFAULT_STATS }: { stats?: { number: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-8 gap-y-3">
      {stats.map((s, i) => (
        <div key={i} className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold text-foreground tabular-nums">{s.number}</span>
          <span className="text-xs text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
