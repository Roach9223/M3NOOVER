/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@m3noover/shared', '@m3noover/ui'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
