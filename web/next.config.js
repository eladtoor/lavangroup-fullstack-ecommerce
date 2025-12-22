/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

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
  // Performance optimizations
  swcMinify: true, // Use SWC for minification (faster than Terser)
  poweredByHeader: false, // Remove X-Powered-By header
  // Experimental features for better performance
  experimental: {
    optimizeCss: true, // Optimize CSS
    optimizePackageImports: ['@fortawesome/fontawesome-free', 'react-toastify'], // Tree-shake unused exports
  },
  // Headers for better caching and performance
  async headers() {
    return [
      {
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
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
    minimumCacheTTL: 31536000, // 1 year cache for images
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/avif', 'image/webp'], // Modern formats for better compression
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

module.exports = withBundleAnalyzer(nextConfig);
