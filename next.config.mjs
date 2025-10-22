/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    serverActions: {
      bodySizeLimit: '1mb'
    }
  }
};

export default nextConfig;
