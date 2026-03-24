import { Button, Heading, Hr, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface SaleNotificationEmailProps {
  sellerName: string;
  productTitle: string;
  pricePaid: number;
  platformFee: number;
  dashboardUrl: string;
}

export function SaleNotificationEmail({
  sellerName,
  productTitle,
  pricePaid,
  platformFee,
  dashboardUrl,
}: SaleNotificationEmailProps) {
  const net = (pricePaid - platformFee).toFixed(2);

  return (
    <EmailLayout preview={`New sale — ${productTitle} — $${pricePaid.toFixed(2)}`}>
      <Heading className="text-[#111111] text-xl font-medium m-0 mb-1">
        You just made a sale
      </Heading>
      <Text className="text-[#6B6B6B] text-sm m-0 mb-6">
        {sellerName ? `Hey ${sellerName}, ` : ""}someone just bought your product.
      </Text>

      <div className="bg-[#F5F4EF] rounded-xl px-5 py-4 mb-6">
        <Text className="text-[#111111] font-medium text-base m-0 mb-3">
          {productTitle}
        </Text>
        <Hr className="border-[#E5E5E5] my-3" />
        <div className="flex justify-between">
          <Text className="text-[#6B6B6B] text-sm m-0">Sale price</Text>
          <Text className="text-[#111111] text-sm font-medium m-0">
            ${pricePaid.toFixed(2)}
          </Text>
        </div>
        <div className="flex justify-between mt-1">
          <Text className="text-[#6B6B6B] text-sm m-0">Platform fee (4.5%)</Text>
          <Text className="text-[#6B6B6B] text-sm m-0">
            −${platformFee.toFixed(2)}
          </Text>
        </div>
        <Hr className="border-[#E5E5E5] my-3" />
        <div className="flex justify-between">
          <Text className="text-[#111111] text-sm font-medium m-0">You earn</Text>
          <Text className="text-[#1A7A4A] text-sm font-medium m-0">${net}</Text>
        </div>
      </div>

      <Button
        href={dashboardUrl}
        className="bg-[#111111] text-white text-sm font-medium px-6 py-3 rounded-[100px] no-underline inline-block"
      >
        View dashboard →
      </Button>
    </EmailLayout>
  );
}

export default SaleNotificationEmail;
