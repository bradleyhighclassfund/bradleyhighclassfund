/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/**": ["./data/**"],
    },
  },
};

export default nextConfig;
