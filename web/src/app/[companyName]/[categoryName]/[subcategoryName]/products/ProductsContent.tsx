'use client';

import React from 'react';
import { useAppSelector } from '@/lib/redux/hooks';
import ProductCard from '@/components/ProductCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getCategoryCanonicalPath } from '@/lib/category-slugs';

interface SeoText {
  seoTitle?: string;
  seoDescription?: string;
  seoContent?: string;
}

interface ProductsContentProps {
  initialProducts: any[];
  initialSeoText: SeoText | null;
  categoryName: string;
  subcategoryName: string;
  companyName: string;
}

export default function ProductsContent({
  initialProducts,
  initialSeoText,
  categoryName,
  subcategoryName,
  companyName,
}: ProductsContentProps) {
  const categories = useAppSelector(
    (state) => state.categories.categories
  );

  // Use server-provided data (SSR)
  const products = initialProducts;
  const seoText = initialSeoText;
  const productsLoading = false; // Products are pre-loaded from server

  if (!categories) {
    return (
      <div className="container mx-auto mt-24 p-6">
        <p className="text-center text-gray-600">טוען קטגוריות...</p>
      </div>
    );
  }

  // Find the category
  const categoriesArray = Array.isArray(categories) ? categories : Object.values(categories);
  const currentCategory = categoriesArray.find(
    (category: any) => category.categoryName === categoryName
  );

  if (!currentCategory) {
    return (
      <div className="container mx-auto mt-24 p-6">
        <p className="text-center text-gray-600">
          לא נמצאה קטגוריה בשם {categoryName}.
        </p>
      </div>
    );
  }

  // Find the subcategory
  const subCategories = currentCategory.subCategories || [];

  // Try exact match first
  let currentSubcategory = subCategories.find(
    (sub: any) => sub.subCategoryName === subcategoryName
  );

  // If not found, try partial match (for cases like "שליכט צבעוני" vs "שליכט")
  if (!currentSubcategory) {
    currentSubcategory = subCategories.find(
      (sub: any) => {
        const subName = sub.subCategoryName || '';
        const searchName = subcategoryName || '';
        // Check if one contains the other
        return subName.includes(searchName) || searchName.includes(subName);
      }
    );
  }

  if (!currentSubcategory) {
    return (
      <div className="container mx-auto mt-24 p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-2">
            לא נמצאה תת-קטגוריה בשם "{subcategoryName}".
          </p>
          <p className="text-sm text-gray-500">
            תתי-קטגוריות זמינות: {subCategories.map((s: any) => s.subCategoryName).join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // Products are fetched on-demand via separate API call (faster loading)
  const isDigitalCatalogCategory = categoryName === 'קטלוגים דיגיטלים להורדה';

  // Build canonical breadcrumb URLs using English slugs
  const categoryCanonicalPath = getCategoryCanonicalPath(companyName || 'טמבור', categoryName);

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: companyName || 'טמבור', href: '/' },
    {
      label: categoryName,
      href: categoryCanonicalPath
    },
    { label: subcategoryName }
  ];

  return (
    <main className="min-h-screen container mx-auto pt-32 md:pt-36 p-6" dir="rtl">
      <Breadcrumbs items={breadcrumbItems} />

      <section aria-label="מוצרים" className="bg-white shadow-lg rounded-xl p-8 text-center border border-gray-200">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-gray-300 pb-2 inline-block">
            {subcategoryName}
          </h1>
        </header>

        {/* SEO Content Section - Show only first paragraph above products */}
        {seoText?.seoContent && (
          <div className="text-right mb-4 px-4">
            <p className="text-gray-600 leading-relaxed text-base">
              {seoText.seoContent.split('\n\n')[0]}
            </p>
          </div>
        )}

        {productsLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">טוען מוצרים...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6 justify-items-center">
            {products.map((product: any, index: number) => (
              <ProductCard
                key={product._id || product.productId}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <p className="text-lg text-gray-600 mt-4">
            לא נמצאו מוצרים בתת-קטגוריה זו.
          </p>
        )}
      </section>

      {/* Remaining SEO Content - At the bottom */}
      {seoText?.seoContent && seoText.seoContent.split('\n\n').length > 1 && (
        <section className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200" aria-label="מידע נוסף">
          <div className="text-right">
            <div className="prose max-w-none text-gray-600">
              {seoText.seoContent.split('\n\n').slice(1).map((block, blockIndex) => {
                const lines = block.split('\n');
                const hasBullets = lines.some(line => line.trim().startsWith('•') || line.trim().startsWith('*'));

                if (hasBullets) {
                  return (
                    <ul key={blockIndex} className="list-disc list-inside mb-3 space-y-1 text-sm">
                      {lines.map((line, lineIndex) => {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('*')) {
                          return (
                            <li key={lineIndex} className="leading-relaxed">
                              {trimmedLine.substring(1).trim()}
                            </li>
                          );
                        } else if (trimmedLine) {
                          return <p key={lineIndex} className="mb-2 leading-relaxed text-sm">{trimmedLine}</p>;
                        }
                        return null;
                      })}
                    </ul>
                  );
                }

                return (
                  <p key={blockIndex} className="mb-3 leading-relaxed text-sm">
                    {block}
                  </p>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
