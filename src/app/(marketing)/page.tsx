import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] font-medium tracking-tight leading-[1.1] mb-4 text-foreground">
        Sell any link.
        <br />
        Instantly.
      </h1>
      <p className="text-[1.1rem] text-muted-foreground mb-10 max-w-[26rem]">
        Paste a link, set a price, share your paywall. Buyers pay once and get
        instant access.
      </p>

      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/auth"
          className="px-7 py-3 bg-primary text-primary-foreground rounded-full font-medium text-base no-underline"
        >
          Become a seller
        </Link>
        <Link
          href="/orders"
          className="px-7 py-3 bg-card text-foreground border border-border rounded-full font-medium text-base no-underline"
        >
          See your orders
        </Link>
      </div>
    </main>
  );
}
