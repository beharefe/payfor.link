import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · unseal.link",
};

export default function PrivacyPage() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
        Legal
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-foreground mb-4">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: April 2026</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-8">

        <div>
          <h2 className="text-base font-medium mb-2">1. Who We Are</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            unseal.link is a paywall link platform. This policy explains what personal data we
            collect, why, and how we use it.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">2. Data We Collect</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Sellers:</strong> email address (for authentication and notifications), name/handle, Stripe account details (managed by Stripe).</li>
            <li><strong className="text-foreground">Buyers:</strong> email address (to deliver your access link and send order receipts).</li>
            <li><strong className="text-foreground">All users:</strong> usage analytics via Amplitude (page views, events — no personally identifiable data sent to Amplitude). Error reports via Sentry. Server logs via Axiom.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">3. Legal Basis (GDPR)</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Buyers:</strong> processing your email is necessary to perform the contract (delivering your purchase). No consent required.</li>
            <li><strong className="text-foreground">Sellers:</strong> processing your email is necessary to provide the seller service you signed up for.</li>
            <li><strong className="text-foreground">Analytics/logging:</strong> legitimate interest in operating and improving the platform.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">4. How We Use Your Data</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li>Sending access links and order confirmations to buyers</li>
            <li>Sending payout and sale notifications to sellers</li>
            <li>Authentication (magic link sign-in for sellers)</li>
            <li>Fraud prevention and abuse monitoring</li>
            <li>Platform analytics and performance monitoring</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">5. Third Parties</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Stripe</strong> — payment processing and seller payouts. Stripe is the data controller for payment data.</li>
            <li><strong className="text-foreground">Supabase</strong> — database and authentication. Data stored in EU region.</li>
            <li><strong className="text-foreground">Resend</strong> — transactional email delivery.</li>
            <li><strong className="text-foreground">Amplitude</strong> — product analytics (EU server zone, cookies disabled).</li>
            <li><strong className="text-foreground">Axiom</strong> — server-side logging.</li>
            <li><strong className="text-foreground">Sentry</strong> — error tracking.</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            We do not sell your data to any third party.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">6. Data Retention</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Buyer email addresses are stored as part of the order record indefinitely for accounting
            and dispute resolution purposes. Sellers may request deletion of their account and
            associated data at any time.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">7. Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Under GDPR you have the right to access, correct, or delete your personal data, and to
            object to or restrict processing. To exercise any of these rights, email us at{" "}
            <a href="mailto:privacy@unseal.link" className="underline">privacy@unseal.link</a>.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">8. Cookies</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use a session cookie to keep buyers signed in to their order history. We do not use
            advertising or tracking cookies. Analytics are collected without cookies.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">9. Changes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this policy. Material changes will be communicated to registered sellers
            by email.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">10. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Privacy questions: <a href="mailto:privacy@unseal.link" className="underline">privacy@unseal.link</a>
          </p>
        </div>

      </div>
    </section>
  );
}
