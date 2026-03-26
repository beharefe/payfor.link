import type { NextConfig } from "next";
import { withAxiom } from "next-axiom";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  async rewrites() {
    return [
      // /@username  → seller profile page
      { source: "/@:username", destination: "/s/:username" },
      // /@username/slug  → paywall with seller verification
      { source: "/@:username/:slug", destination: "/pay/:username/:slug" },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withAxiom(withNextIntl(nextConfig));
