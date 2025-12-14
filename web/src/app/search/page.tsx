'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';
import ProductCard from '@/components/ProductCard';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function SearchResults() {
  const products = useAppSelector((state) => state.products.products);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  useEffect(() => {
    if (query && products.length > 0) {
      const lowerQuery = query.toLowerCase();
      const regex = new RegExp(lowerQuery.split('').join('.*'), 'i');
      const queryAsNumber = Number(query);

      // Exact name matches (highest priority)
      const exactNameMatches = products.filter((product) =>
        product['שם'].toLowerCase() === lowerQuery
      );

      // Partial matches by ID, name, or SKU
      const partialMatches = products.filter((product) => {
        const productIdString = String(product['מזהה']).trim();
        const productIdNumber = Number(product['מזהה']);

        const isExactIdMatch =
          productIdString === query.trim() || productIdNumber === queryAsNumber;
        const isNameMatch = regex.test(product['שם']);
        const isSkuMatch = regex.test(product['מק"ט']);

        return isExactIdMatch || isNameMatch || isSkuMatch;
      });

      // Remove duplicates (products already in exact matches)
      const filteredPartialMatches = partialMatches.filter(
        (product) => !exactNameMatches.includes(product)
      );

      // Combine and limit to 9 results
      const results = [...exactNameMatches, ...filteredPartialMatches].slice(0, 9);
      setFilteredProducts(results);
    }
  }, [query, products]);

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: `חיפוש: ${query || ''}` }
  ];

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'בית',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `חיפוש: ${query || ''}`,
        item: `${baseUrl}/search?query=${encodeURIComponent(query || '')}`,
      },
    ],
  };

  return (
        <main className="min-h-screen max-w-screen-lg mx-auto pt-32 md:pt-36 p-4 sm:p-6" dir="rtl">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
          />
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              תוצאות חיפוש עבור: <span className="text-blue-600">{query}</span>
            </h1>
          </header>

          <section aria-label="תוצאות חיפוש" className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6 justify-items-center">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">
                לא נמצאו תוצאות תואמות.
              </p>
            )}
          </section>
        </main>
  );
}
