import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Turbopack enabled by default in Next 16; leave empty config to silence mixed-mode warning.
  turbopack: {},
};

export default nextConfig;
