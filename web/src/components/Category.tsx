'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { buildCategoryUrl } from '@/lib/category-slugs';

interface Subcategory {
  categoryName: string;
  products?: Array<{ תמונות?: string }>; // תמונות is Hebrew for "images"
  subCategories?: Array<{
    subCategoryName: string;
    products: Array<{ תמונות?: string }>;
  }>;
}

interface CategoryImage {
  name: string;
  image: string;
}

interface CategoryProps {
  title: string;
  subcategories: Subcategory[] | Record<string, Subcategory>;
}

export default function Category({ title, subcategories }: CategoryProps) {
  const router = useRouter();
  const [categoryImages, setCategoryImages] = useState<CategoryImage[]>([]);

  const moveToSubcategory = (subcategoryName: string) => {
    const url = buildCategoryUrl(title, subcategoryName);
    router.push(url);
  };

  const subcategoryArray = Array.isArray(subcategories)
    ? subcategories
    : Object.values(subcategories);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category-images`)
      .then((res) => res.json())
      .then((data) => setCategoryImages(data))
      .catch((err) => console.error('Error fetching category images:', err));
  }, []);

  return (
    <div className="w-full">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-300">
        {title}
      </h2>

      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
        {subcategoryArray.length > 0 ? (
          subcategoryArray.map((subcategory, index) => {
            const imageForCategory = categoryImages.find(
              (cat) => cat.name === subcategory.categoryName
            )?.image;

            const fallbackImage =
              subcategory.subCategories?.[0]?.products[0]?.תמונות ||
              subcategory.products?.[0]?.תמונות ||
              '/placeholder-product.png';

            return (
              <button
                key={index}
                title={`עבור לקטגוריית ${subcategory.categoryName} - מגוון מוצרים איכותיים`}
                aria-label={`עבור לקטגוריית ${subcategory.categoryName}`}
                className="flex flex-col items-center bg-white border border-gray-200 rounded-lg p-3 md:p-4 transition-all duration-200 hover:shadow-lg hover:border-orange-500"
                onClick={() => moveToSubcategory(subcategory.categoryName)}
              >
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden mb-2">
                  <Image
                    src={imageForCategory || fallbackImage}
                    alt={`${subcategory.categoryName} - ${title} | לבן גרופ חומרי בניין`}
                    title={subcategory.categoryName}
                    fill
                    priority={index < 6}
                    className="object-cover hover:brightness-110 transition-all duration-300"
                    sizes="(max-width: 768px) 64px, 80px"
                  />
                </div>

                <p className="text-xs md:text-sm font-medium text-gray-900 text-center line-clamp-2">
                  {subcategory.categoryName}
                </p>
              </button>
            );
          })
        ) : (
          <p className="text-gray-500 text-center col-span-full">אין קטגוריות זמינות</p>
        )}
      </div>
    </div>
  );
}
