import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface ProductPausedReviewProps {
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerEmail?: string | null;
  previousStatus: string;
  destinationHost?: string | null;
  destinationPlatform?: string | null;
  destinationRiskLevel?: string | null;
  destinationRiskReasons?: string[] | null;
  destinationUrlHash?: string | null;
  totalSales: number;
  reviewUrl: string;
}

export function ProductPausedReviewEmail({
  productId,
  productTitle,
  sellerId,
  sellerEmail,
  previousStatus,
  destinationHost,
  destinationPlatform,
  destinationRiskLevel,
  destinationRiskReasons,
  destinationUrlHash,
  totalSales,
  reviewUrl,
}: ProductPausedReviewProps) {
  const riskColor =
    destinationRiskLevel === "medium"
      ? { bg: "#FEF3C7", border: "#D97706", label: "#92400E" }
      : { bg: "#FEE2E2", border: "#DC2626", label: "#991B1B" };

  return (
    <EmailLayout preview={`[Review needed] ${productTitle} paused for link review`}>
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        Product paused for link review
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 32px" }}>
        A seller changed their access link on a product with sales. Review and approve or reject below.
      </Text>

      <div style={{ background: riskColor.bg, borderRadius: "12px", padding: "24px", marginBottom: "32px", borderLeft: `4px solid ${riskColor.border}` }}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "8px", width: "160px" }}>Product</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontWeight: 600 }}>{productTitle}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "8px" }}>Product ID</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontFamily: "monospace" }}>{productId}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "8px" }}>Seller ID</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontFamily: "monospace" }}>{sellerId}</td>
          </tr>
          {sellerEmail && (
            <tr>
              <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "8px" }}>Seller email</td>
              <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{sellerEmail}</td>
            </tr>
          )}
          <tr>
            <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "8px" }}>Previous status</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{previousStatus}</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "8px" }}>New status</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontWeight: 600 }}>paused_link_review</td>
          </tr>
          <tr>
            <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "8px" }}>Total sales</td>
            <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{totalSales}</td>
          </tr>
          {destinationHost && (
            <tr>
              <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "8px" }}>Destination host</td>
              <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontFamily: "monospace" }}>{destinationHost}</td>
            </tr>
          )}
          {destinationPlatform && (
            <tr>
              <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "8px" }}>Platform</td>
              <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{destinationPlatform}</td>
            </tr>
          )}
          {destinationRiskLevel && (
            <tr>
              <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "8px" }}>Risk level</td>
              <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px", fontWeight: 600 }}>{destinationRiskLevel.toUpperCase()}</td>
            </tr>
          )}
          {destinationRiskReasons && destinationRiskReasons.length > 0 && (
            <tr>
              <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "8px" }}>Risk reasons</td>
              <td style={{ fontSize: "13px", color: "#3D3530", paddingBottom: "8px" }}>{destinationRiskReasons.join(", ")}</td>
            </tr>
          )}
          {destinationUrlHash && (
            <tr>
              <td style={{ fontSize: "13px", color: riskColor.label, fontWeight: 600, paddingBottom: "0" }}>URL hash (SHA-256)</td>
              <td style={{ fontSize: "11px", color: "#6B6B6B", fontFamily: "monospace", wordBreak: "break-all" }}>{destinationUrlHash}</td>
            </tr>
          )}
        </table>
      </div>

      <a
        href={reviewUrl}
        style={{
          display: "inline-block",
          background: "#111111",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "100px",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
          marginBottom: "24px",
        }}
      >
        Review product →
      </a>

      <Text style={{ fontSize: "13px", color: "#6B6B6B", margin: "0" }}>
        Existing buyers keep the access they originally purchased. New purchases are paused until you approve or reject the link change.
      </Text>
    </EmailLayout>
  );
}

export default ProductPausedReviewEmail;
