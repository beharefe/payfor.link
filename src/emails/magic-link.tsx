import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MagicLinkEmailProps {
  otpCode?: string;
  link?: string;
  heading?: string;
  body?: string;
  cta?: string;
  expiresIn?: string;
}

export function MagicLinkEmail({
  otpCode,
  link,
  heading = "Let's get you signed in",
  body,
  cta = "Sign in →",
  expiresIn = "10 minutes",
}: MagicLinkEmailProps) {
  const isOtpMode = Boolean(otpCode);
  const preview = isOtpMode
    ? `${otpCode} is your sign-in code for unseal.link`
    : "Your sign-in link for unseal.link";

  return (
    <EmailLayout preview={preview}>
      <Text style={{ fontSize: "24px", fontWeight: 700, color: "#3D3530", margin: "0 0 8px" }}>
        {heading}
      </Text>
      <Text style={{ fontSize: "15px", color: "#6B6B6B", margin: "0 0 32px" }}>
        {isOtpMode
          ? `Enter this code to sign in. It expires in ${expiresIn}.`
          : (body ?? `Use the secure link below to sign in. It expires in ${expiresIn}.`)}
      </Text>

      {isOtpMode ? (
        <div
          style={{
            background: "#F5F3EE",
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "44px",
              fontWeight: 700,
              letterSpacing: "14px",
              color: "#3D3530",
            }}
          >
            {otpCode}
          </span>
        </div>
      ) : link ? (
        <a
          href={link}
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
          {cta}
        </a>
      ) : null}

      <Text style={{ fontSize: "13px", color: "#A09A94", margin: 0 }}>
        If you didn&apos;t request this, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default MagicLinkEmail;
