import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface OtpCodeEmailProps {
  otpCode: string;
  productTitle: string;
}

export function OtpCodeEmail({ otpCode, productTitle }: OtpCodeEmailProps) {
  return (
    <EmailLayout preview={`${otpCode} is your verification code`}>
      <Heading className="text-[#111111] text-xl font-medium m-0 mb-2">
        Verify your email
      </Heading>
      <Text className="text-[#6B6B6B] text-sm m-0 mb-6">
        Enter this code to access your purchase of{" "}
        <span className="text-[#111111] font-medium">{productTitle}</span>:
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
        Expires in 15 minutes. If you didn&apos;t make a purchase, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default OtpCodeEmail;
