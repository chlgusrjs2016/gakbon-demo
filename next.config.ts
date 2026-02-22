import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/export/pdf": [
      "./assets/fonts/**/*",
      "./node_modules/@sparticuz/chromium/bin/**",
      "./node_modules/@sparticuz/chromium/build/**",
      "./node_modules/@fontsource/courier-prime/**",
      "./node_modules/follow-redirects/**",
      "./node_modules/tar-fs/**",
    ],
  },
};

export default nextConfig;
