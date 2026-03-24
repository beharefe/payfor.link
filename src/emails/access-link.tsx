import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface AccessLinkEmailProps {
  unlockUrl: string;
  productTitle: string;
}

export function AccessLinkEmail({ unlockUrl, productTitle }: AccessLinkEmailProps) {
  return (
    <EmailLayout preview={`Your access link for ${productTitle}`}>
      <Heading className="text-[#111111] text-xl font-medium m-0 mb-2">
        Here&apos;s your access link
      </Heading>
      <Text className="text-[#6B6B6B] text-sm m-0 mb-1">
        You requested access to:
      </Text>
      <Text className="text-[#111111] font-medium text-base m-0 mb-6">
        {productTitle}
      </Text>
      <Button
        href={unlockUrl}
        className="bg-[#111111] text-white text-sm font-medium px-6 py-3 rounded-[100px] no-underline inline-block mb-6"
      >
        Access your purchase →
      </Button>
      <Text className="text-[#999999] text-xs m-0">
        This link expires in 24 hours and can only be used once.
        If you didn&apos;t request this, ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default AccessLinkEmail;
