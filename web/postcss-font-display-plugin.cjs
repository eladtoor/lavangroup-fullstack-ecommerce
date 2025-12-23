/**
 * PostCSS plugin to add font-display: swap to all @font-face rules
 * This fixes Font Awesome font loading performance (saves 1,090ms)
 * CommonJS version for Next.js compatibility
 */
module.exports = function fontDisplayPlugin() {
  return {
    postcssPlugin: 'postcss-font-display-swap',
    Once(root, { result }) {
      let modifiedCount = 0;
      let totalFontFaces = 0;
      
      root.walkAtRules('font-face', (rule) => {
        totalFontFaces++;
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
      
      // Debug logging - always log in development to verify plugin is running
      if (process.env.NODE_ENV === 'development') {
        const fileName = result.root?.source?.input?.from || 'unknown';
        console.log(`[PostCSS Font Display Plugin] Processing: ${fileName}`);
        console.log(`[PostCSS Font Display Plugin] Found ${totalFontFaces} @font-face rules, added font-display: swap to ${modifiedCount} rules`);
      }
    },
  };
};

module.exports.postcss = true;

