import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	reactCompiler: true,

	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cmykprint.shop",
				pathname: "/**",
			},
		],
	},
}

export default nextConfig
