import { MetadataRoute } from 'next';
import { CANONICAL_BASE_URL } from '@/lib/category-slugs';

export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${CANONICAL_BASE_URL}/sitemap.xml`,
  };
}

