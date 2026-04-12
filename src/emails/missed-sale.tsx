import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MissedSaleEmailProps {
  sellerName: string;
  productTitle: string;
  dashboardUrl: string;
}

export function MissedSaleEmail({
  sellerName,
  productTitle,
  dashboardUrl,
}: MissedSaleEmailProps) {
  return (
    <EmailLayout preview={`Someone tried to buy "${productTitle}" but your payout isn't set up`}>
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        You almost made a sale
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 24px" }}>
        {sellerName ? `Hey ${sellerName}, s` : "S"}omeone just visited your paywall for{" "}
        <strong style={{ color: "#3D3530" }}>{productTitle}</strong>, but they couldn't buy because
        your Stripe payout account isn't connected yet.
      </Text>

      <div style={{ background: "#FEF3C7", borderRadius: "12px", padding: "20px 24px", marginBottom: "32px", borderLeft: "4px solid #F59E0B" }}>
        <Text style={{ fontSize: "14px", color: "#92400E", margin: "0" }}>
          Connect Stripe to activate your link and start accepting payments. Takes about 2 minutes.
        </Text>
      </div>

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
        Connect Stripe now →
      </a>

      <Text style={{ fontSize: "13px", color: "#A09A94", marginTop: "32px" }}>
        You're receiving this because someone visited your paywall link. Once you connect Stripe, your link goes live instantly.
      </Text>
    </EmailLayout>
  );
}

export default MissedSaleEmail;
