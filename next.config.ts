import withPWA from "@ducanh2912/next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // disable in dev to avoid caching bugs
  register: true,
});

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default pwaConfig(nextConfig);
