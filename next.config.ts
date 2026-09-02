import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next',
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    const backendBase = process.env.BACKEND_API_URL || 'http://localhost:4010';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendBase}/api/v1/:path*`,
      },
    ];
  },
  allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok.io'],
};

export default nextConfig;
