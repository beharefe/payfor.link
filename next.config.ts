import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withAxiom } from "next-axiom";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default withAxiom(withNextIntl(nextConfig));
