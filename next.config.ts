import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile devices on the local network to access the dev server
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '10.18.1.28',
    '192.168.*',
    '10.*',
  ],
  serverExternalPackages: ['better-sqlite3'],
  output: 'standalone',
};

export default nextConfig;
