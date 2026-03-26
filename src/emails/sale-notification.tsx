import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface SaleNotificationEmailProps {
  sellerName: string;
  productTitle: string;
  pricePaid: number;
  platformFee: number;
  dashboardUrl: string;
}

export function SaleNotificationEmail({
  sellerName,
  productTitle,
  pricePaid,
  platformFee,
  dashboardUrl,
}: SaleNotificationEmailProps) {
  const net = (pricePaid - platformFee).toFixed(2);

  return (
    <EmailLayout preview={`New sale — ${productTitle} — $${pricePaid.toFixed(2)}`}>
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        You just made a sale
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 32px" }}>
        {sellerName ? `Hey ${sellerName}, ` : ""}someone just bought your product.
      </Text>

      <div style={{ background: "#F5F3EE", borderRadius: "12px", padding: "24px", marginBottom: "32px" }}>
        <Text style={{ fontSize: "15px", fontWeight: 600, color: "#3D3530", margin: "0 0 16px" }}>
          {productTitle}
        </Text>
        <div style={{ borderTop: "1px solid #E3E1DC", paddingTop: "16px" }}>
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td style={{ fontSize: "14px", color: "#6B6B6B", paddingBottom: "8px" }}>Sale price</td>
              <td style={{ fontSize: "14px", color: "#3D3530", fontWeight: 500, textAlign: "right", paddingBottom: "8px" }}>${pricePaid.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ fontSize: "14px", color: "#6B6B6B", paddingBottom: "16px" }}>Platform fee (4.5%)</td>
              <td style={{ fontSize: "14px", color: "#6B6B6B", textAlign: "right", paddingBottom: "16px" }}>−${platformFee.toFixed(2)}</td>
            </tr>
          </table>
          <div style={{ borderTop: "1px solid #E3E1DC", paddingTop: "16px" }}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td style={{ fontSize: "15px", fontWeight: 600, color: "#3D3530" }}>You earn</td>
                <td style={{ fontSize: "15px", fontWeight: 700, color: "#D1A054", textAlign: "right" }}>${net}</td>
              </tr>
            </table>
          </div>
        </div>
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
        View dashboard →
      </a>
    </EmailLayout>
  );
}

export default SaleNotificationEmail;
