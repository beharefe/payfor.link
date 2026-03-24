import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface KycCompleteEmailProps {
  dashboardUrl: string;
}

export function KycCompleteEmail({ dashboardUrl }: KycCompleteEmailProps) {
  return (
    <EmailLayout preview="You can now withdraw your earnings">
      <Heading className="text-[#111111] text-xl font-medium m-0 mb-2">
        You&apos;re verified
      </Heading>
      <Text className="text-[#6B6B6B] text-sm m-0 mb-6">
        Identity verification is complete. You can now withdraw your earnings to
        your bank account directly from the dashboard.
      </Text>
      <Button
        href={`${dashboardUrl}/settings`}
        className="bg-[#111111] text-white text-sm font-medium px-6 py-3 rounded-[100px] no-underline inline-block"
      >
        Withdraw earnings →
      </Button>
    </EmailLayout>
  );
}

export default KycCompleteEmail;
