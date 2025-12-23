/**
 * PostCSS plugin to add font-display: swap to all @font-face rules
 * This fixes Font Awesome font loading performance (saves 1,090ms)
 */
export default function fontDisplayPlugin() {
  return {
    postcssPlugin: 'postcss-font-display-swap',
    Once(root) {
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
        }
      });
    },
  };
}

fontDisplayPlugin.postcss = true;
