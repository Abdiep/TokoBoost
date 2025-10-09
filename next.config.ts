if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './.env' });
}
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4.5mb',
      serverActionsBodySizeLimit: '4.5mb',
    },
  },
  env: {
    // SERVICE_ACCOUNT_KEY is now imported directly, no need to expose here.
    DATABASE_URL: process.env.DATABASE_URL,
    MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY,
    NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
  }
};

export default nextConfig;
