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
        <Body className="bg-[#F0EDE8] font-sans m-0 py-8 px-0">
          <Container style={{ maxWidth: "560px", width: "100%", margin: "0 auto", background: "#ffffff", borderRadius: "16px", padding: "32px 20px" }}>
            <div style={{ marginBottom: "32px" }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 600, color: "#3D3530", letterSpacing: "-0.3px" }}>
                unseal.link
              </span>
            </div>
            {children}
          </Container>
          <Container style={{ maxWidth: "560px", width: "100%", margin: "0 auto", padding: "20px 20px 32px" }}>
            <p className="text-[#A09A94] text-xs text-center m-0">
              unseal.link · Lock any link, sell instant access
            </p>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
