import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Private / non-indexable routes
        '/search',
        '/admin-panel',
        '/agent-dashboard',
        '/my-orders',
        '/order-management',
        '/user-profile',
        '/user-management',
        '/purchase-history',
        '/user-info',
        '/api'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

