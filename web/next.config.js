/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Generate build ID to help with caching
  generateBuildId: async () => {
    return process.env.RENDER_GIT_COMMIT || `build-${Date.now()}`;
  },
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
    // Disable image optimization to save memory (512MB RAM only)
    unoptimized: process.env.NODE_ENV === 'production',
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
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
  // Render often installs production deps only; don't fail builds on eslint availability.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
