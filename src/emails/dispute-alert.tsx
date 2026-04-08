import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface DisputeAlertProps {
  orderId: string;
  productTitle: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  reason: string;
  evidenceDueBy?: number | null;
  sellerEmail?: string | null;
  isSellerCopy?: boolean;
  sellerName?: string | null;
}

export function DisputeAlert({
  orderId,
  productTitle,
  buyerEmail,
  amount,
  currency,
  reason,
  evidenceDueBy,
  isSellerCopy,
  sellerEmail,
  sellerName,
}: DisputeAlertProps) {
  const shortId = orderId.slice(0, 8).toUpperCase();
  const dueDate = evidenceDueBy
    ? new Date(evidenceDueBy * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const heading = isSellerCopy ? "A buyer has opened a dispute" : "Dispute opened";
  const subheading = isSellerCopy
    ? `${sellerName ? `Hey ${sellerName}, a` : "A"} buyer has disputed their payment for "${productTitle}" through their bank. Stripe will handle the process — you may be asked to provide evidence.`
    : `A chargeback has been filed. Stripe will reach out for evidence. Review the details below.`;

  return (
    <EmailLayout preview={`Dispute: ${productTitle} · $${amount.toFixed(2)}`}>
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        {heading}
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 32px" }}>
        {subheading}
      </Text>

      <div style={{ background: "#FEE2E2", borderRadius: "12px", padding: "24px", marginBottom: "32px", borderLeft: "4px solid #DC2626" }}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={{ fontSize: "13px", color: "#991B1B", fontWeight: 600, paddingBottom: "8px", width: "130px" }}>Product</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{productTitle}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: "#991B1B", fontWeight: 600, paddingBottom: "8px" }}>Amount</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontWeight: 600 }}>${amount.toFixed(2)} {currency.toUpperCase()}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: "#991B1B", fontWeight: 600, paddingBottom: "8px" }}>Reason</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{reason.replace(/_/g, " ")}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: "#991B1B", fontWeight: 600, paddingBottom: "8px" }}>Buyer</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{buyerEmail}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: "#991B1B", fontWeight: 600, paddingBottom: "8px" }}>Order ref</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontFamily: "monospace" }}>#{shortId}</td>
          </tr>
          {!isSellerCopy && sellerEmail && (
            <tr>
              <td style={{ fontSize: "13px", color: "#991B1B", fontWeight: 600, paddingBottom: "8px" }}>Seller</td>
              <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{sellerEmail}</td>
            </tr>
          )}
          {dueDate && (
            <tr>
              <td style={{ fontSize: "13px", color: "#991B1B", fontWeight: 600 }}>Evidence due</td>
              <td style={{ fontSize: "13px", color: "#991B1B", fontWeight: 600 }}>{dueDate}</td>
            </tr>
          )}
        </table>
      </div>

      <Text style={{ fontSize: "13px", color: "#6B6B6B", margin: "0" }}>
        {isSellerCopy
          ? "Stripe will contact you directly if they need evidence. You can also log in to your Stripe dashboard to track the dispute status."
          : "Log in to the Stripe dashboard to respond to this dispute before the evidence deadline."}
      </Text>
    </EmailLayout>
  );
}

export default DisputeAlert;
