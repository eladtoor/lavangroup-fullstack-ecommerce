/** @type {import('postcss-load-config').Config} */
import fontDisplayPlugin from './postcss-font-display-plugin.js';

const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Add font-display: swap to all @font-face rules (fixes Font Awesome - saves 1,090ms)
    'postcss-font-display-swap': fontDisplayPlugin(),
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
};

export default config;
