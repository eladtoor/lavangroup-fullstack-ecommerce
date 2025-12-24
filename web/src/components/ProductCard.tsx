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

  const materialGroupTranslations: Record<string, string> = {
    'Colors and Accessories': 'צבעים ומוצרים נלווים',
    'Powders': 'אבקות (דבקים וטייח)',
    'Gypsum and Tracks': 'גבס ומסלולים'
  };

  const getMaterialGroupColor = (group: string) => {
    switch (group) {
      case 'Colors and Accessories':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Powders':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Gypsum and Tracks':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const materialGroup = product.materialGroup;
  const materialGroupLabel = materialGroup ? materialGroupTranslations[materialGroup] || materialGroup : null;

  return (
    <Link
      href={`/product/${product._id}-${slug}`}
      scroll={false}
      className="block"
      title={`פתח מוצר: ${product.שם}`}
      aria-label={`פתח מוצר: ${product.שם}`}
    >
      <article
        className="relative bg-white rounded-lg border border-gray-900 overflow-visible hover:scale-110 transition-all duration-300 hover:shadow-lg cursor-pointer p-4 flex flex-col items-center w-56 h-56 sm:w-60 sm:h-80"
        style={{ willChange: 'transform' }}
        itemScope
        itemType="https://schema.org/Product"
      >
        {/* Material Group Badge */}
        {materialGroupLabel && (
          <div className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-semibold border ${getMaterialGroupColor(materialGroup)} shadow-sm`}>
            {materialGroupLabel}
          </div>
        )}

        <div className="w-full h-32 sm:h-40 bg-gray-100 flex justify-center items-center rounded-md overflow-hidden flex-shrink-0 mb-2 relative">
          {product.תמונות ? (
            <Image
              src={
                product.תמונות && typeof product.תמונות === 'string' && product.תמונות.includes('cloudinary.com') && product.תמונות.includes('/upload/')
                  ? product.תמונות.replace(/\/upload\/([^\/]*\/)?/, '/upload/f_auto,q_auto:good,w_300,h_300,c_limit/')
                  : product.תמונות
              }
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


