import Link from "next/link";
import { NewLinkForm } from "./new-link-form";

export default function NewLinkPage() {
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
