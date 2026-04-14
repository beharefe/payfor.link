import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface BuyerDisputeAlertProps {
  buyerEmail: string;
  issueType: string;
  productName: string;
  sellerUsername: string;
  amountPaid: number;
  currency: string;
  paymentIntentId: string;
  orderId: string;
  tag: "SUPPORT" | "ABUSE";
  timestamp: string;
}

export function BuyerDisputeAlert({
  buyerEmail,
  issueType,
  productName,
  sellerUsername,
  amountPaid,
  currency,
  paymentIntentId,
  orderId,
  tag,
  timestamp,
}: BuyerDisputeAlertProps) {
  const isAbuse = tag === "ABUSE";
  const bgColor = isAbuse ? "#FEF3C7" : "#EFF6FF";
  const borderColor = isAbuse ? "#D97706" : "#3B82F6";
  const labelColor = isAbuse ? "#92400E" : "#1E40AF";

  return (
    <EmailLayout preview={`[${tag}] ${productName} — ${issueType}`}>
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        {isAbuse ? "Abuse report" : "Buyer dispute"}
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 32px" }}>
        {isAbuse
          ? "A buyer flagged this content as not matching the description. Review and take action if needed."
          : "A buyer contacted support after completing a purchase. Review the details below."}
      </Text>

      <div style={{ background: bgColor, borderRadius: "12px", padding: "24px", marginBottom: "32px", borderLeft: `4px solid ${borderColor}` }}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={{ fontSize: "13px", color: labelColor, fontWeight: 600, paddingBottom: "8px", width: "140px" }}>Issue</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontWeight: 600 }}>{issueType}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: labelColor, fontWeight: 600, paddingBottom: "8px" }}>Product</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{productName}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: labelColor, fontWeight: 600, paddingBottom: "8px" }}>Seller</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>@{sellerUsername}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: labelColor, fontWeight: 600, paddingBottom: "8px" }}>Buyer</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{buyerEmail}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: labelColor, fontWeight: 600, paddingBottom: "8px" }}>Amount</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>${amountPaid.toFixed(2)} {currency.toUpperCase()}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: labelColor, fontWeight: 600, paddingBottom: "8px" }}>Payment ID</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontFamily: "monospace" }}>{paymentIntentId}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: labelColor, fontWeight: 600, paddingBottom: "8px" }}>Order ref</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontFamily: "monospace" }}>#{orderId.slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: labelColor, fontWeight: 600 }}>Submitted</td>
            <td style={{ fontSize: "13px", color: "#3D3530" }}>{timestamp}</td>
          </tr>
        </table>
      </div>

      <Text style={{ fontSize: "13px", color: "#6B6B6B", margin: "0" }}>
        {isAbuse
          ? "If this is a legitimate abuse report, suspend the product in your Supabase dashboard."
          : "Reply to the buyer at the address above. Target response time: 24 hours."}
      </Text>
    </EmailLayout>
  );
}

export default BuyerDisputeAlert;
