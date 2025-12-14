'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';
import ProductCard from '@/components/ProductCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import { parseUrlParams } from '@/lib/category-slugs';

export default function ProductsContent() {
  const params = useParams();
  const { categoryName, subcategoryName } = parseUrlParams({
    categoryName: params.categoryName as string,
    subcategoryName: params.subcategoryName as string,
  });

  const categories = useAppSelector(
    (state) => state.categories.categories
  );

  if (!categories) {
    return (
      <div className="container mx-auto mt-24 p-6">
        <p className="text-center text-gray-600">קטגוריות לא זמינות.</p>
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

  const products = currentSubcategory.products || [];
  const isDigitalCatalogCategory = categoryName === 'קטלוגים דיגיטלים להורדה';
  const companyName = params.companyName ? decodeURIComponent(params.companyName as string) : '';

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: companyName || 'טמבור', href: '/' },
    { 
      label: categoryName, 
      href: `/${encodeURIComponent(companyName)}/${encodeURIComponent(categoryName)}` 
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

        {products.length > 0 ? (
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
    </main>
  );
}

