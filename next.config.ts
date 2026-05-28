import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:4000/api/v1/:path*';
    return [
      {
        source: '/api/v1/:path*',
        destination: backendUrl,
      },
    ];
  },
  allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok.io'],
};

export default nextConfig;
