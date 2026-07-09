import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent bundling of Node.js-only packages — they must stay as externals
  // so Next.js uses them via require() in the Node runtime, not bundled code.
  serverExternalPackages: ["mammoth"],
};

export default nextConfig;
