import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Terms of Service · unseal.link" },
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
      <p className="text-sm text-muted-foreground mb-10">Last updated: April 2026</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-8">

        <div>
          <h2 className="text-base font-medium mb-2">1. Overview</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            unseal.link ("we", "our", "the platform") is a paywall service that allows sellers to
            lock any URL behind a payment and share it with buyers. By accessing or using unseal.link
            you agree to these Terms of Service. If you do not agree, do not use the platform.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">2. Sellers</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To sell on unseal.link you must create an account, connect a Stripe account, and comply
            with Stripe's Connected Account Agreement. You are solely responsible for the content,
            legality, and delivery of what you sell. You must not list content that is illegal,
            fraudulent, infringes third-party rights, or violates Stripe's terms. We reserve the
            right to suspend or remove any listing at our discretion.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">3. Buyers</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Purchases are final unless a refund is issued by the seller. Access links are
            single-use and expire after 24 hours. If you believe a seller has committed fraud,
            contact us at support@unseal.link. We do not host content; we only facilitate
            access to URLs provided by sellers.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">4. Platform Fee</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We charge a platform fee of 4.5% on each transaction. This is deducted automatically
            at the time of purchase via Stripe. Stripe's standard processing fees apply separately.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">5. Refunds</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Refunds are at the discretion of the seller. If a seller issues a refund, the full
            purchase amount is returned to the buyer. Platform fees are non-refundable. If a
            seller is unresponsive to a legitimate refund request, contact us and we will review
            the case.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">6. Prohibited Use</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You may not use unseal.link to distribute malware, phishing links, illegal content,
            adult content, or anything that violates applicable law. Accounts found in violation
            will be suspended immediately without notice.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">7. Disclaimer of Warranties</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The platform is provided "as is" without warranties of any kind. We do not guarantee
            uninterrupted availability or that any particular feature will remain available.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">8. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, unseal.link shall not be liable for any
            indirect, incidental, or consequential damages arising from use of the platform.
            Our total liability to you shall not exceed the fees you paid us in the 12 months
            preceding the claim.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">9. Changes to These Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update these terms at any time. Continued use of the platform after changes
            constitutes acceptance. Material changes will be communicated by email to registered
            sellers.
          </p>
        </div>

        <div>
          <h2 className="text-base font-medium mb-2">10. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Questions? Email us at <a href="mailto:support@unseal.link" className="underline">support@unseal.link</a>.
          </p>
        </div>

      </div>
    </section>
  );
}
