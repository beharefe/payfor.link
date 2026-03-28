import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="text-center max-w-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
          404
        </p>
        <h1 className="text-3xl font-medium tracking-tight text-foreground mb-3">
          Page not found
        </h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          This link doesn&apos;t exist or may have been removed.
        </p>
        <div className="flex flex-col items-center sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Go home
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center px-5 py-2.5 border border-border rounded-full font-medium text-sm no-underline text-foreground hover:bg-muted transition-colors"
          >
            View your orders
          </Link>
        </div>
      </div>
    </main>
  );
}
