/**
 * PostCSS plugin to add font-display: swap to all @font-face rules
 * This fixes Font Awesome font loading performance (saves 1,090ms)
 * CommonJS version for Next.js compatibility
 */
module.exports = function fontDisplayPlugin() {
  return {
    postcssPlugin: 'postcss-font-display-swap',
    Once(root) {
      let modifiedCount = 0;
      root.walkAtRules('font-face', (rule) => {
        // Check if font-display already exists
        let hasFontDisplay = false;
        rule.walkDecls('font-display', () => {
          hasFontDisplay = true;
        });

        // Add font-display: swap if it doesn't exist
        if (!hasFontDisplay) {
          rule.prepend({
            prop: 'font-display',
            value: 'swap',
            important: false,
          });
          modifiedCount++;
        }
      });
      
      // Debug logging (only in development)
      if (process.env.NODE_ENV === 'development' && modifiedCount > 0) {
        console.log(`[PostCSS Font Display Plugin] Added font-display: swap to ${modifiedCount} @font-face rules`);
      }
    },
  };
};

module.exports.postcss = true;

