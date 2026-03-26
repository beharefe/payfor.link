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
        <Body className="bg-[#F0EDE8] font-sans m-0 py-10 px-4">
          <Container className="bg-white max-w-[560px] mx-auto rounded-2xl" style={{ padding: "48px" }}>
            <div style={{ marginBottom: "40px" }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 600, color: "#3D3530", letterSpacing: "-0.3px" }}>
                unseal.link
              </span>
            </div>
            {children}
          </Container>
          <Container className="max-w-[560px] mx-auto px-4 pt-6 pb-10">
            <p className="text-[#A09A94] text-xs text-center m-0">
              unseal.link · Lock any link, sell instant access
            </p>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
