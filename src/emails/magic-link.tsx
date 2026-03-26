import { Button, Heading, Hr, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MagicLinkEmailProps {
  link: string;
  /** @default "Sign in to your orders" */
  heading?: string;
  /** @default "Click below to view all your purchases. No password needed." */
  body?: string;
  /** @default "View my orders →" */
  cta?: string;
  /** @default "7 days" */
  expiresIn?: string;
}

export function MagicLinkEmail({
  link,
  heading = "Sign in to your orders",
  body = "Click below to view all your purchases. No password needed.",
  cta = "View my orders →",
  expiresIn = "7 days",
}: MagicLinkEmailProps) {
  return (
    <EmailLayout preview={heading}>
      <Heading className="text-[#111111] text-xl font-medium m-0 mb-1">
        {heading}
      </Heading>
      <Text className="text-[#6B6B6B] text-sm m-0 mb-6">{body}</Text>

      <Button
        href={link}
        className="bg-[#111111] text-white text-sm font-medium px-6 py-3 rounded-[100px] no-underline inline-block mb-6"
      >
        {cta}
      </Button>

      <Hr className="border-[#E5E5E5] my-4" />

      <Text className="text-[#999999] text-xs m-0">
        This link expires in {expiresIn}. If you didn&apos;t request this, you
        can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default MagicLinkEmail;
