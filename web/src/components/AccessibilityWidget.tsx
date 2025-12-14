'use client';

import { useEffect } from 'react';

export default function AccessibilityWidget() {
  useEffect(() => {
    // Check if accessibility widget is already loaded
    if ((window as any).accessibilityWidgetLoaded) {
      return;
    }

    // Mark as loaded to prevent duplicate loading
    (window as any).accessibilityWidgetLoaded = true;

    // Load Enable.co.il accessibility widget (works on localhost)
    const existingScript = document.querySelector('script[src*="enable.co.il"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://cdn.enable.co.il/licenses/enable-L37446yg0khs8c0x-1224-72895/init.js";
      script.async = true;
      script.setAttribute("id", "accessibility-widget-script");

      // After script loads, apply custom positioning
      script.onload = () => {
        setTimeout(() => {
          // Find and reposition the accessibility button
          const accessButton = document.querySelector('.access_icon') ||
                             document.querySelector('#access_icon') ||
                             document.querySelector('[class*="access"]');

          if (accessButton && accessButton instanceof HTMLElement) {
            accessButton.style.cssText = `
              position: fixed !important;
              top: 120px !important;
              right: 15px !important;
              bottom: auto !important;
              left: auto !important;
              width: 70px !important;
              height: 70px !important;
              z-index: 999999 !important;
            `;
          }
        }, 1000); // Wait 1 second for widget to initialize
      };

      document.body.appendChild(script);
    }
  }, []);

  return null; // This component doesn't render anything visible directly
}
