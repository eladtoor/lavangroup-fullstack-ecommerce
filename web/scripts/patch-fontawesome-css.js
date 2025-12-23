/**
 * Build script to patch Font Awesome CSS to add font-display: swap
 * This runs before Next.js build to modify the CSS file directly
 */
const fs = require('fs');
const path = require('path');

const fontAwesomePath = path.join(
  __dirname,
  '../node_modules/@fortawesome/fontawesome-free/css/all.min.css'
);

const backupPath = fontAwesomePath + '.backup';

function patchFontAwesomeCSS() {
  try {
    // Check if file exists
    if (!fs.existsSync(fontAwesomePath)) {
      console.log('[Font Awesome Patch] ⚠️  Font Awesome CSS not found, skipping patch');
      return;
    }

    // Read the CSS file
    let css = fs.readFileSync(fontAwesomePath, 'utf8');

    // Check if already patched
    if (css.includes('font-display:swap') || css.includes('font-display: swap')) {
      console.log('[Font Awesome Patch] ✅ Font Awesome CSS already has font-display: swap');
      return;
    }

    // Create backup if it doesn't exist
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(fontAwesomePath, backupPath);
      console.log('[Font Awesome Patch] 📦 Created backup of original CSS');
    }

    // Replace font-display:block with font-display:swap in all @font-face rules
    // Font Awesome uses font-display:block by default, we need to change it to swap
    css = css.replace(
      /(@font-face\s*\{[^}]*)(\})/g,
      (match, before, closingBrace) => {
        // Replace font-display:block with font-display:swap
        if (before.includes('font-display:block')) {
          return before.replace(/font-display:block/g, 'font-display:swap') + closingBrace;
        }
        // If font-display exists but isn't block, leave it alone
        if (before.includes('font-display')) {
          return match;
        }
        // Add font-display:swap if it doesn't exist
        return before + 'font-display:swap;' + closingBrace;
      }
    );

    // Write the patched CSS
    fs.writeFileSync(fontAwesomePath, css, 'utf8');
    console.log('[Font Awesome Patch] ✅ Successfully added font-display: swap to Font Awesome CSS');
  } catch (error) {
    console.error('[Font Awesome Patch] ❌ Error patching CSS:', error.message);
    // Restore backup if patch failed
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, fontAwesomePath);
      console.log('[Font Awesome Patch] 🔄 Restored original CSS from backup');
    }
  }
}

// Run the patch
patchFontAwesomeCSS();

