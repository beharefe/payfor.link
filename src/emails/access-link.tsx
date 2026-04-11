import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface AccessLinkEmailProps {
  unlockUrl: string;
  productTitle: string;
}

export function AccessLinkEmail({ unlockUrl, productTitle }: AccessLinkEmailProps) {
  return (
    <EmailLayout preview={`Your access link for ${productTitle}`}>
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        Here&apos;s your access link
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 4px" }}>
        You bought:
      </Text>
      <Text style={{ fontSize: "16px", fontWeight: 600, color: "#3D3530", margin: "0 0 32px" }}>
        {productTitle}
      </Text>

      <a
        href={unlockUrl}
        style={{
          display: "inline-block",
          background: "#3D3530",
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: 600,
          padding: "14px 28px",
          borderRadius: "100px",
          textDecoration: "none",
          marginBottom: "32px",
        }}
      >
        Access your link →
      </a>

      <Text style={{ fontSize: "13px", color: "#A09A94", margin: 0 }}>
        This link expires in 7 days. If you didn&apos;t request this, ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default AccessLinkEmail;
