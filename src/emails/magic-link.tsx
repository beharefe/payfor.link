import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MagicLinkEmailProps {
  otpCode: string;
}

export function MagicLinkEmail({ otpCode }: MagicLinkEmailProps) {
  return (
    <EmailLayout preview={`${otpCode} is your sign-in code for unseal.link`}>
      <Heading className="text-[#111111] text-xl font-medium m-0 mb-2">
        Sign in to unseal.link
      </Heading>
      <Text className="text-[#6B6B6B] text-sm m-0 mb-6">
        Enter this code to sign in. It expires in 10 minutes.
      </Text>
      <div className="bg-[#F5F4EF] rounded-xl px-6 py-5 text-center mb-6">
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "40px",
            fontWeight: 700,
            letterSpacing: "12px",
            color: "#111111",
          }}
        >
          {otpCode}
        </span>
      </div>
      <Text className="text-[#999999] text-xs m-0">
        If you didn&apos;t request this, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default MagicLinkEmail;
