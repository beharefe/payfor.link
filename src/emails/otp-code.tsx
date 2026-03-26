import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface OtpCodeEmailProps {
  otpCode: string;
  productTitle: string;
}

export function OtpCodeEmail({ otpCode, productTitle }: OtpCodeEmailProps) {
  return (
    <EmailLayout preview={`${otpCode} is your verification code`}>
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        Verify your purchase
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 32px" }}>
        Enter this code to access{" "}
        <span style={{ color: "#3D3530", fontWeight: 600 }}>{productTitle}</span>:
      </Text>

      <div style={{ background: "#F5F3EE", borderRadius: "12px", padding: "24px", textAlign: "center", marginBottom: "32px" }}>
        <span style={{ fontFamily: "monospace", fontSize: "44px", fontWeight: 700, letterSpacing: "14px", color: "#3D3530" }}>
          {otpCode}
        </span>
      </div>

      <Text style={{ fontSize: "13px", color: "#A09A94", margin: 0 }}>
        Expires in 15 minutes. If you didn&apos;t make a purchase, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default OtpCodeEmail;
