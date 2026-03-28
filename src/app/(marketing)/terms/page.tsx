import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service · unseal.link",
};

export default function TermsPage() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
        Legal
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-foreground mb-4">
        Terms of Service
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Coming soon. Please check back later.
      </p>
    </section>
  );
}
