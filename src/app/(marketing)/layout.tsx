import { Footer } from "@unseallink/components/footer";
import { Navbar } from "@unseallink/components/navbar";
import { PromoBanner } from "@unseallink/components/promo-banner";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <PromoBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
