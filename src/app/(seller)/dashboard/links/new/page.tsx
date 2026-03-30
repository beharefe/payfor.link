import Link from "next/link";
import { NewLinkForm } from "./new-link-form";


export default function NewLinkPage() {
  return (
    <main>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/dashboard/links"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline block mb-6"
        >
          ← Links
        </Link>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
          New link
        </p>
        <h1 className="text-3xl font-medium tracking-tight text-foreground mb-8">
          Create a paywall link
        </h1>
        <NewLinkForm />
      </div>
    </main>
  );
}
