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

    return () => {
      // Cleanup
      const iframe = document.querySelector('iframe.goog-te-menu-frame');
      if (iframe) iframe.remove();
    };
  }, []);

  return (
    <div id="google_translate_element" style={{ display: 'none' }}></div>
  );
}
