/** @type {import('next').NextConfig} */
// Bundle analyzer is optional - only load if available and ANALYZE=true
let withBundleAnalyzer = (config) => config;
try {
  if (process.env.ANALYZE === 'true') {
    const bundleAnalyzer = require('@next/bundle-analyzer');
    withBundleAnalyzer = bundleAnalyzer({
      enabled: true,
    });
  }
} catch (e) {
  // Bundle analyzer not installed, skip it
  console.log('Bundle analyzer not available, skipping...');
}

// Load custom PostCSS plugin for font-display: swap
const fontDisplayPlugin = require('./postcss-font-display-plugin.cjs');

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
    // optimizeCss: true, // Disabled - causes build errors with critters
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
  // Webpack configuration to add custom PostCSS plugin
  webpack: (config, { isServer, dev }) => {
    // Find PostCSS loader and inject our custom plugin
    // Next.js processes CSS through multiple loaders, we need to catch all of them
    const findAndModifyPostCSSLoader = (rules) => {
      if (!rules) return;
      
      for (const rule of rules) {
        if (rule.oneOf) {
          findAndModifyPostCSSLoader(rule.oneOf);
        }
        
        if (rule.use && Array.isArray(rule.use)) {
          for (const use of rule.use) {
            if (use.loader && typeof use.loader === 'string' && use.loader.includes('postcss-loader')) {
              // Get or create postcssOptions
              if (!use.options) use.options = {};
              if (!use.options.postcssOptions) use.options.postcssOptions = {};
              
              // Handle both object and array plugin formats
              if (!use.options.postcssOptions.plugins) {
                use.options.postcssOptions.plugins = [];
              }
              
              let plugins = use.options.postcssOptions.plugins;
              
              // Convert object to array if needed
              if (!Array.isArray(plugins)) {
                const pluginsArray = [];
                for (const [name, options] of Object.entries(plugins)) {
                  try {
                    const plugin = require(name);
                    pluginsArray.push(options ? [plugin, options] : plugin);
                  } catch (e) {
                    // Plugin not found, skip
                  }
                }
                plugins = pluginsArray;
                use.options.postcssOptions.plugins = plugins;
              }
              
              // Check if our plugin is already added
              const pluginName = fontDisplayPlugin.postcss || 'postcss-font-display-swap';
              const alreadyAdded = plugins.some(p => {
                if (typeof p === 'function' && p.postcssPlugin === pluginName) return true;
                if (Array.isArray(p) && p[0] && p[0].postcssPlugin === pluginName) return true;
                return false;
              });
              
              // Add our custom plugin if not already present
              if (!alreadyAdded) {
                plugins.push(fontDisplayPlugin());
                if (dev) {
                  console.log('[Next.js Config] Added font-display PostCSS plugin to loader');
                }
              }
            }
          }
        }
      }
    };
    
    findAndModifyPostCSSLoader(config.module.rules);
    
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
