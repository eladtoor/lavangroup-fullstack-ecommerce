'use client';

import { useEffect, useState } from 'react';

export default function FloatingActionButtons() {
  const [accessibilityButton, setAccessibilityButton] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const findAccessibilityButton = (): HTMLElement | null => {
      const candidates: Array<Element | null> = [
        document.querySelector('.access_icon'),
        document.querySelector('#access_icon'),
        document.querySelector('[class*="access"]'),
      ];

      for (const el of candidates) {
        if (el instanceof HTMLElement) return el;
      }
      return null;
    };

    // Function to move accessibility button to our container
    const moveButtonToContainer = () => {
      const accessButton = findAccessibilityButton();
      
      if (accessButton) {
        setAccessibilityButton(accessButton);
        const container = document.getElementById('accessibility-container');
        if (container && accessButton.parentNode !== container) {
          container.appendChild(accessButton);
          accessButton.style.cssText = 'position: relative !important; width: 100% !important; height: 100% !important;';
        }
      }
    };

    // Check if accessibility widget is already loaded
    if ((window as any).accessibilityWidgetLoaded) {
      moveButtonToContainer();
      // Keep checking in case button loads later
      const interval = setInterval(moveButtonToContainer, 500);
      return () => clearInterval(interval);
    }

    // Mark as loaded to prevent duplicate loading
    (window as any).accessibilityWidgetLoaded = true;

    // Load Enable.co.il accessibility widget
    const existingScript = document.querySelector('script[src*="enable.co.il"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://cdn.enable.co.il/licenses/enable-L37446yg0khs8c0x-1224-72895/init.js";
      script.async = true;
      script.setAttribute("id", "accessibility-widget-script");

      // After script loads, find and move the accessibility button
      script.onload = () => {
        // Function to hide reset settings button (איפוס הגדרות)
        const hideResetButton = () => {
          // Try multiple selectors to find the reset button
          const allButtons = document.querySelectorAll('button, a, [role="button"], div[onclick]');
          allButtons.forEach((btn) => {
            const text = (btn.textContent || btn.getAttribute('aria-label') || btn.getAttribute('title') || '').trim();
            // Only hide if it contains "איפוס" (reset) - this is the reset settings button
            if (text.includes('איפוס') && text.includes('הגדרות')) {
              const parent = btn.parentElement;
              // Make sure it's not the main accessibility icon button
              if (!btn.classList.contains('access_icon') && 
                  !btn.id.includes('access_icon') && 
                  parent && 
                  !parent.classList.contains('access_icon') && 
                  !parent.id.includes('access_icon')) {
                (btn as HTMLElement).style.display = 'none';
                (btn as HTMLElement).style.visibility = 'hidden';
                (btn as HTMLElement).style.opacity = '0';
                (btn as HTMLElement).style.pointerEvents = 'none';
              }
            }
          });
        };

        // Check multiple times as widget may take time to initialize
        const checkInterval = setInterval(() => {
          const accessButton = findAccessibilityButton();

          if (accessButton) {
            clearInterval(checkInterval);
            moveButtonToContainer();
            hideResetButton();
          }
        }, 200);

        // Also hide reset button periodically after widget loads
        setTimeout(() => {
          hideResetButton();
          setInterval(hideResetButton, 1000);
        }, 2000);

        // Stop checking after 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
      };

      document.body.appendChild(script);
    } else {
      // Script already exists, just try to move button
      setTimeout(() => {
        moveButtonToContainer();
        // Hide reset button (איפוס הגדרות)
        const hideResetButton = () => {
          const allButtons = document.querySelectorAll('button, a, [role="button"], div[onclick]');
          allButtons.forEach((btn) => {
            const text = (btn.textContent || btn.getAttribute('aria-label') || btn.getAttribute('title') || '').trim();
            // Only hide if it contains both "איפוס" and "הגדרות"
            if (text.includes('איפוס') && text.includes('הגדרות')) {
              const parent = btn.parentElement;
              if (!btn.classList.contains('access_icon') && 
                  !btn.id.includes('access_icon') && 
                  parent && 
                  !parent.classList.contains('access_icon') && 
                  !parent.id.includes('access_icon')) {
                (btn as HTMLElement).style.display = 'none';
                (btn as HTMLElement).style.visibility = 'hidden';
                (btn as HTMLElement).style.opacity = '0';
                (btn as HTMLElement).style.pointerEvents = 'none';
              }
            }
          });
        };
        hideResetButton();
        setInterval(hideResetButton, 1000);
      }, 1000);
    }
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3 items-center">
      {/* Translate Button Container */}
      <div className="bg-white rounded-full shadow-lg p-2 hover:shadow-xl transition-all hover:scale-105">
        <div className="gtranslate_wrapper"></div>
      </div>

      {/* Accessibility Button Container */}
      <div 
        id="accessibility-container"
        className="bg-white rounded-full shadow-lg p-2 hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        style={{ width: '60px', height: '60px' }}
      />
    </div>
  );
}

