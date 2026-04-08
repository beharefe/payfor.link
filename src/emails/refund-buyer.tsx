import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface RefundBuyerEmailProps {
  productTitle: string;
  pricePaid: number;
  currency: string;
  orderId: string;
  sellerName?: string | null;
}

export function RefundBuyerEmail({
  productTitle,
  pricePaid,
  currency,
  orderId,
  sellerName,
}: RefundBuyerEmailProps) {
  const shortId = orderId.slice(0, 8).toUpperCase();

  return (
    <EmailLayout preview={`Refund confirmed: ${productTitle} · $${pricePaid.toFixed(2)}`}>
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        Your refund is on the way
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 32px" }}>
        {sellerName ? `${sellerName} has` : "The seller has"} issued a full refund for your order. It typically appears on your statement within 5–10 business days depending on your bank.
      </Text>

      <div style={{ background: "#F5F3EE", borderRadius: "12px", padding: "24px", marginBottom: "32px" }}>
        <Text style={{ fontSize: "15px", fontWeight: 600, color: "#3D3530", margin: "0 0 16px" }}>
          {productTitle}
        </Text>
        <div style={{ borderTop: "1px solid #E3E1DC", paddingTop: "16px" }}>
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td style={{ fontSize: "14px", color: "#6B6B6B", paddingBottom: "8px" }}>Amount refunded</td>
              <td style={{ fontSize: "14px", fontWeight: 600, color: "#3D3530", textAlign: "right", paddingBottom: "8px" }}>${pricePaid.toFixed(2)} {currency.toUpperCase()}</td>
            </tr>
            <tr>
              <td style={{ fontSize: "14px", color: "#6B6B6B" }}>Order ref</td>
              <td style={{ fontSize: "14px", color: "#6B6B6B", textAlign: "right", fontFamily: "monospace" }}>#{shortId}</td>
            </tr>
          </table>
        </div>
      </div>

      <Text style={{ fontSize: "13px", color: "#6B6B6B", margin: "0" }}>
        If you have questions, reply to this email or contact the seller directly.
      </Text>
    </EmailLayout>
  );
}

export default RefundBuyerEmail;
