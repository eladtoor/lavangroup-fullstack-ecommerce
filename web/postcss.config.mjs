/** @type {import('postcss-load-config').Config} */
import fontDisplayPlugin from './postcss-font-display-plugin.mjs';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Use array syntax to avoid package resolution issues
// When using string keys in object syntax, PostCSS tries to require them as packages
// Array syntax allows direct function references for custom plugins
const plugins = [
  tailwindcss,
  autoprefixer,
  // Add font-display: swap to all @font-face rules (fixes Font Awesome - saves 1,090ms)
  fontDisplayPlugin(),
];

// Add cssnano in production using object spread (PostCSS will handle it as a package)
const config = {
  plugins: process.env.NODE_ENV === 'production' 
    ? [...plugins, 'cssnano']  // String name works for real packages
    : plugins,
};

export default config;
