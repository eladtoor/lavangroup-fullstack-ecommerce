/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optional: set NEXT_DIST_DIR in your local env if OneDrive locks `.next/trace`.
  // In production/CI, leave NEXT_DIST_DIR unset so Next uses the default `.next`.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  // CSS Optimization
  productionBrowserSourceMaps: false, // Disable source maps in production
  compress: true, // Enable gzip compression
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      }
    ],
  },
  // Proxy API requests to Express server
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
  // Enable styled-components SSR
  compiler: {
    styledComponents: true,
  },
};

module.exports = nextConfig;
