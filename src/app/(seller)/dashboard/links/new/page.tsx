import Link from "next/link";
import { NewLinkForm } from "./new-link-form";

export default function NewLinkPage() {
  return (
    <main>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard/links"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            ← Links
          </Link>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            New link
          </p>
        </div>
        <NewLinkForm />
      </div>
    </main>
  );
}
