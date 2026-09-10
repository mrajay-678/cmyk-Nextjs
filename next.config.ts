import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cmykprint.shop",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "wp.cmykprint.shop",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "printy.themerex.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
