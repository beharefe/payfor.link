import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface Promotion {
  name: string;
  description: string | null;
}

interface SellerWelcomeEmailProps {
  sellerName: string | null;
  dashboardUrl: string;
  promotions?: Promotion[];
}

export function SellerWelcomeEmail({
  sellerName,
  dashboardUrl,
  promotions = [],
}: SellerWelcomeEmailProps) {
  const greeting = sellerName ? `Hey ${sellerName},` : "Hey,";

  return (
    <EmailLayout preview="Your store is live — you can start selling">
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        You're live.
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 24px" }}>
        {greeting} your Stripe account is connected and your store is active. Buyers can now
        purchase your links and receive instant access.
      </Text>

      {promotions.length > 0 && (
        <div style={{ background: "#F5F3EE", borderRadius: "12px", padding: "24px", marginBottom: "32px" }}>
          <Text style={{ fontSize: "13px", fontWeight: 600, color: "#A09A94", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Active promotion
          </Text>
          {promotions.map((promo, i) => (
            <div key={i}>
              <Text style={{ fontSize: "15px", fontWeight: 600, color: "#3D3530", margin: "0 0 4px" }}>
                {promo.name}
              </Text>
              {promo.description && (
                <Text style={{ fontSize: "14px", color: "#6B6B6B", margin: "0" }}>
                  {promo.description}
                </Text>
              )}
            </div>
          ))}
        </div>
      )}

      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 32px" }}>
        Head to your dashboard to manage your links, track sales, and set up payouts when you're
        ready.
      </Text>

      <a
        href={dashboardUrl}
        style={{
          display: "inline-block",
          background: "#3D3530",
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: 600,
          padding: "14px 28px",
          borderRadius: "100px",
          textDecoration: "none",
        }}
      >
        Go to dashboard →
      </a>
    </EmailLayout>
  );
}

export default SellerWelcomeEmail;
