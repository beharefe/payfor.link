import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface AbuseReportAlertProps {
  productId: string;
  productTitle?: string;
  reason: string;
  description?: string | null;
  reporterEmail?: string | null;
  orderId?: string | null;
}

export function AbuseReportAlert({
  productId,
  productTitle,
  reason,
  description,
  reporterEmail,
  orderId,
}: AbuseReportAlertProps) {
  return (
    <EmailLayout preview={`New abuse report: ${reason} for ${productTitle ?? productId}`}>
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        New abuse report
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 32px" }}>
        A buyer has flagged a product. Review the details below.
      </Text>

      <div style={{ background: "#FEF3C7", borderRadius: "12px", padding: "24px", marginBottom: "32px", borderLeft: "4px solid #D97706" }}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={{ fontSize: "13px", color: "#92400E", fontWeight: 600, paddingBottom: "8px", width: "120px" }}>Reason</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontWeight: 600 }}>{reason}</td>
          </tr>
          {productTitle && (
            <tr>
              <td style={{ fontSize: "13px", color: "#92400E", fontWeight: 600, paddingBottom: "8px" }}>Product</td>
              <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{productTitle}</td>
            </tr>
          )}
          <tr>
            <td style={{ fontSize: "13px", color: "#92400E", fontWeight: 600, paddingBottom: "8px" }}>Product ID</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontFamily: "monospace" }}>{productId}</td>
          </tr>
          {reporterEmail && (
            <tr>
              <td style={{ fontSize: "13px", color: "#92400E", fontWeight: 600, paddingBottom: "8px" }}>Reporter</td>
              <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{reporterEmail}</td>
            </tr>
          )}
          {orderId && (
            <tr>
              <td style={{ fontSize: "13px", color: "#92400E", fontWeight: 600, paddingBottom: "8px" }}>Order ref</td>
              <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontFamily: "monospace" }}>{orderId}</td>
            </tr>
          )}
          {description && (
            <tr>
              <td style={{ fontSize: "13px", color: "#92400E", fontWeight: 600, paddingBottom: "0" }}>Details</td>
              <td style={{ fontSize: "13px", color: "#3D3530" }}>{description}</td>
            </tr>
          )}
        </table>
      </div>

      <Text style={{ fontSize: "13px", color: "#6B6B6B", margin: "0" }}>
        Review this report in your Supabase dashboard and take action (suspend the product or dismiss) if needed.
      </Text>
    </EmailLayout>
  );
}

export default AbuseReportAlert;
