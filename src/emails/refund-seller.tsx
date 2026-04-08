import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface RefundSellerEmailProps {
  sellerName: string;
  productTitle: string;
  pricePaid: number;
  platformFee: number;
  currency: string;
  buyerEmail: string;
  orderId: string;
  note?: string | null;
  dashboardUrl: string;
}

export function RefundSellerEmail({
  sellerName,
  productTitle,
  pricePaid,
  platformFee,
  currency,
  buyerEmail,
  orderId,
  note,
  dashboardUrl,
}: RefundSellerEmailProps) {
  const net = (pricePaid - platformFee).toFixed(2);
  const shortId = orderId.slice(0, 8).toUpperCase();

  return (
    <EmailLayout preview={`Refund issued: ${productTitle} · $${pricePaid.toFixed(2)}`}>
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        Refund issued
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 32px" }}>
        {sellerName ? `Hey ${sellerName}, you` : "You"} issued a full refund to {buyerEmail}. Stripe will reverse the payout to your account.
      </Text>

      <div style={{ background: "#F5F3EE", borderRadius: "12px", padding: "24px", marginBottom: "32px" }}>
        <Text style={{ fontSize: "15px", fontWeight: 600, color: "#3D3530", margin: "0 0 16px" }}>
          {productTitle}
        </Text>
        <div style={{ borderTop: "1px solid #E3E1DC", paddingTop: "16px" }}>
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td style={{ fontSize: "14px", color: "#6B6B6B", paddingBottom: "8px" }}>Amount refunded</td>
              <td style={{ fontSize: "14px", color: "#3D3530", fontWeight: 500, textAlign: "right", paddingBottom: "8px" }}>${pricePaid.toFixed(2)} {currency.toUpperCase()}</td>
            </tr>
            <tr>
              <td style={{ fontSize: "14px", color: "#6B6B6B", paddingBottom: "8px" }}>Platform fee reversed</td>
              <td style={{ fontSize: "14px", color: "#6B6B6B", textAlign: "right", paddingBottom: "8px" }}>+${platformFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ fontSize: "14px", color: "#6B6B6B", paddingBottom: "8px" }}>Buyer</td>
              <td style={{ fontSize: "14px", color: "#3D3530", textAlign: "right", paddingBottom: "8px" }}>{buyerEmail}</td>
            </tr>
            <tr>
              <td style={{ fontSize: "14px", color: "#6B6B6B" }}>Order ref</td>
              <td style={{ fontSize: "14px", color: "#6B6B6B", textAlign: "right", fontFamily: "monospace" }}>#{shortId}</td>
            </tr>
          </table>
          <div style={{ borderTop: "1px solid #E3E1DC", paddingTop: "16px", marginTop: "16px" }}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td style={{ fontSize: "15px", fontWeight: 600, color: "#3D3530" }}>Net impact</td>
                <td style={{ fontSize: "15px", fontWeight: 700, color: "#C0392B", textAlign: "right" }}>−${net}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      {note && (
        <div style={{ background: "#F5F3EE", borderRadius: "12px", padding: "16px 24px", marginBottom: "24px" }}>
          <Text style={{ fontSize: "13px", color: "#6B6B6B", margin: "0 0 4px", fontWeight: 600 }}>Your note</Text>
          <Text style={{ fontSize: "14px", color: "#3D3530", margin: "0" }}>{note}</Text>
        </div>
      )}

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
        View dashboard →
      </a>
    </EmailLayout>
  );
}

export default RefundSellerEmail;
