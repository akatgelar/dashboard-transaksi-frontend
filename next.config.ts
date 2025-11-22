import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  pageExtensions: ["tsx", "ts"], 
  output: "standalone",
};

export default withSentryConfig(nextConfig, {
  org: "gdn",
  project: "dashboard-frontend",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true, 
  automaticVercelMonitors: true,
});