import Link from "next/link";
import { NewLinkForm } from "./new-link-form";

export default function NewLinkPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            ← Dashboard
          </Link>
        </div>
      </div>
      <div className="max-w-xl mx-auto px-6 py-12">
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
