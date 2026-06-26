import Link from "next/link";
import { NewLinkForm } from "./new-link-form";

const IS_SHUTDOWN = process.env.UNSEAL_SHUTDOWN_MODE === "true";

export default function NewLinkPage() {
  if (IS_SHUTDOWN) {
    return (
      <main>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href="/dashboard/links"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            ← Links
          </Link>
          <div className="mt-10 max-w-sm space-y-3">
            <h1 className="text-xl font-medium tracking-tight text-foreground">
              New products are closed
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              unseal.link is shutting down and no longer accepts new products or product changes.
              Existing buyer access remains available during the shutdown period.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-10">
          <Link
            href="/dashboard/links"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            ← Links
          </Link>
          <h1 className="text-2xl font-medium tracking-tight text-foreground mt-6 mb-1">
            New paywall link
          </h1>
          <p className="text-sm text-muted-foreground">
            Paste any URL, set a price, share your paywall.
          </p>
        </div>
        <NewLinkForm />
      </div>
    </main>
  );
}
