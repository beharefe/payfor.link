import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Tailwind,
} from "@react-email/components";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-[#F5F4EF] font-sans m-0 p-0">
          <Container className="bg-white max-w-[480px] mx-auto my-10 p-8 rounded-2xl border border-[#E5E5E5]">
            {children}
          </Container>
          <Container className="max-w-[480px] mx-auto px-8 pb-8">
            <p className="text-[#999999] text-xs text-center m-0">
              unseal.link · Lock any link, sell instant access
            </p>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
