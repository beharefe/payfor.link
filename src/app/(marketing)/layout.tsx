import { Footer } from "@unseallink/components/footer";
import { Navbar } from "@unseallink/components/navbar";

const isShutdown = process.env.UNSEAL_SHUTDOWN_MODE === "true";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar isShutdown={isShutdown} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
