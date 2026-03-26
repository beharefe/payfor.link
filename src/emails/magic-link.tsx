import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MagicLinkEmailProps {
  link: string;
}

export function MagicLinkEmail({ link }: MagicLinkEmailProps) {
  return (
    <EmailLayout preview="Sign in to view your orders on unseal.link">
      <Heading className="text-[#111111] text-xl font-medium m-0 mb-1">
        Sign in to your orders
      </Heading>
      <Text className="text-[#6B6B6B] text-sm m-0 mb-6">
        Click below to view all your purchases. No password needed.
      </Text>

      <Button
        href={link}
        className="bg-[#111111] text-white text-sm font-medium px-6 py-3 rounded-[100px] no-underline inline-block mb-6"
      >
        View my orders →
      </Button>

      <Text className="text-[#999999] text-xs m-0">
        This link expires in 7 days. If you didn&apos;t request this, you can
        safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default MagicLinkEmail;
