/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lucide-react"],
  serverExternalPackages: ["bullmq", "ioredis"],
};

export default nextConfig;
