'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer: any[];
  }
}

const GTM_ID = 'GTM-WCGRTXK2';
const GA4_MEASUREMENT_ID = 'G-W93SPNXDKS';

export default function GoogleTagManager() {
  // Defer GTM and GA4 loading until after page is fully interactive
  // This reduces main-thread work and improves TBT (Total Blocking Time)
  useEffect(() => {
    // Initialize dataLayer immediately but defer script loading
    if (typeof window !== 'undefined' && !window.dataLayer) {
      window.dataLayer = window.dataLayer || [];
    }
  }, []);

  return (
    <>
      {/* Google Tag Manager - Load after page is interactive (saves 115 KiB) */}
      <Script
        id="google-tag-manager"
        strategy="lazyOnload"
        onLoad={() => {
          // Track that GTM loaded
          if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({ event: 'gtm_loaded' });
          }
        }}
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
      
      {/* Google Analytics 4 (gtag.js) - Deferred loading (saves 55 KiB) */}
      <Script
        id="google-analytics-gtag-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_MEASUREMENT_ID}', {
              'send_page_view': false
            });
          `,
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
        strategy="lazyOnload"
        async
        defer
      />
      
      {/* Google Tag Manager - Noscript */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}

