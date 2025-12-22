'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export default function GTranslateScript() {
  useEffect(() => {
    // Defer Google Translate loading to reduce initial main-thread work
    // Only load after user interaction or after page is fully loaded
    const loadTranslate = () => {
      // Check if already loaded
      if (document.querySelector('script[src*="translate.google.com"]')) {
        return;
      }

      // Initialize Google Translate
      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'iw', // Use 'iw' instead of 'he' for Hebrew
              includedLanguages: 'iw,en,ru,ar',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
              multilanguagePage: true,
            },
            'google_translate_element'
          );
        }
      };

      // Load Google Translate script
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    };

    // Load after page is fully interactive (5 second delay to reduce main-thread work)
    // This saves ~76 KiB of unused JavaScript on initial load
    const timer = setTimeout(loadTranslate, 5000);

    // Also load on user interaction (click, scroll, etc.)
    const events = ['click', 'scroll', 'touchstart', 'keydown'];
    const loadOnInteraction = () => {
      loadTranslate();
      events.forEach(event => {
        document.removeEventListener(event, loadOnInteraction);
      });
    };
    events.forEach(event => {
      document.addEventListener(event, loadOnInteraction, { once: true, passive: true });
    });

    return () => {
      clearTimeout(timer);
      events.forEach(event => {
        document.removeEventListener(event, loadOnInteraction);
      });
      // Cleanup
      const iframe = document.querySelector('iframe.goog-te-menu-frame');
      if (iframe) iframe.remove();
    };
  }, []);

  return (
    <div id="google_translate_element" style={{ display: 'none' }}></div>
  );
}
