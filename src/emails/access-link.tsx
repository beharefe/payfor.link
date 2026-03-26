import { Button, Heading, Hr, Link, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface AccessLinkEmailProps {
  accessLink: string;
  productTitle: string;
  orderUrl: string;
  expiresIn: string;
}

export function AccessLinkEmail({
  accessLink,
  productTitle,
  orderUrl,
  expiresIn,
}: AccessLinkEmailProps) {
  return (
    <EmailLayout preview={`Your access link — ${productTitle}`}>
      <Heading className="text-[#111111] text-xl font-medium m-0 mb-1">
        Your access is ready
      </Heading>
      <Text className="text-[#6B6B6B] text-sm m-0 mb-6">
        Thanks for your purchase. Click below to access your content.
      </Text>

      <div className="bg-[#F5F4EF] rounded-xl px-5 py-4 mb-6">
        <Text className="text-[#111111] font-medium text-base m-0">
          {productTitle}
        </Text>
      </div>

      <Button
        href={accessLink}
        className="bg-[#111111] text-white text-sm font-medium px-6 py-3 rounded-[100px] no-underline inline-block mb-6"
      >
        Access content →
      </Button>

      <Hr className="border-[#E5E5E5] my-4" />

      <Text className="text-[#999999] text-xs m-0 mb-1">
        This link expires in {expiresIn}.
      </Text>
      <Text className="text-[#999999] text-xs m-0">
        <Link href={orderUrl} className="text-[#999999]">
          View your order
        </Link>{" "}
        · If you didn&apos;t make this purchase, ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default AccessLinkEmail;
