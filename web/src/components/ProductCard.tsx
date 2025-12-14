'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cleanDescription } from '@/lib/utils/textUtils';
import { slugifyProductName } from '@/lib/product-slug';

type Product = {
  _id: string;
  שם: string;
  'תיאור קצר'?: string;
  תמונות?: string;
  [key: string]: any;
};

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const slug = slugifyProductName(product.שם);

  return (
    <Link
      href={`/product/${product._id}-${slug}`}
      scroll={false}
      className="block"
      title={`פתח מוצר: ${product.שם}`}
      aria-label={`פתח מוצר: ${product.שם}`}
    >
      <article
        className="relative bg-white rounded-lg border border-gray-900 overflow-hidden hover:scale-110 transition-all duration-300 hover:shadow-lg cursor-pointer p-4 flex flex-col items-center w-56 h-56 sm:w-60 sm:h-80"
        itemScope
        itemType="https://schema.org/Product"
      >
        <div className="w-full h-32 sm:h-40 bg-gray-100 flex justify-center items-center rounded-md overflow-hidden flex-shrink-0 mb-2 relative">
          {product.תמונות ? (
            <Image
              src={product.תמונות}
              alt={`${product.שם}${product['תיאור קצר'] ? ' - ' + String(product['תיאור קצר']).slice(0, 100) : ''} | לבן גרופ`}
              title={product.שם}
              fill
              priority={priority}
              className="object-contain p-2"
              sizes="(max-width: 640px) 112px, 144px"
            />
          ) : (
            <div className="text-gray-400 text-sm">אין תמונה</div>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-gray-800 text-center line-clamp-2 mb-1">
          {product.שם}
        </h3>

        <div className="hidden sm:block flex-1 overflow-hidden">
          <p className="text-xs text-gray-600 text-center line-clamp-2">
            {cleanDescription(product['תיאור קצר'], 100)}
          </p>
        </div>

        <div className="text-center mt-auto pt-2">
          <span className="text-blue-600 text-sm font-medium hover:underline">הצג עוד</span>
        </div>
      </article>
    </Link>
  );
}


