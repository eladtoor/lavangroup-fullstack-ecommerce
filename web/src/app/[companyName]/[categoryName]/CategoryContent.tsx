'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { maybeFetchCategories } from '@/lib/redux/actions/categoryActions';
import ProductCard from '@/components/ProductCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import { parseUrlParams, buildCategoryUrl, categoryToSlug } from '@/lib/category-slugs';

export default function CategoryContent() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Parse URL slugs to Hebrew names
  const { categoryName, companyName } = parseUrlParams({
    categoryName: params.categoryName as string,
    companyName: params.companyName as string,
  });

  const categories = useAppSelector(
    (state) => state.categories.categories
  );
  
  const isLoading = useAppSelector(
    (state) => state.categories.loading
  );

  // Handle different structures
  let categoriesArray: any[] = [];
  
  if (Array.isArray(categories)) {
    // Direct array
    categoriesArray = categories;
  } else if (categories && typeof categories === 'object') {
    // Check if it's CategoryStructure with companyCategories
    if ('companyCategories' in categories) {
      const companyCats = (categories as any).companyCategories;
      if (Array.isArray(companyCats)) {
        categoriesArray = companyCats;
      } else if (companyCats && typeof companyCats === 'object') {
        categoriesArray = Object.values(companyCats);
      }
    } else {
      // Try Object.values
      categoriesArray = Object.values(categories);
    }
  }

  // Fetch categories if not loaded or empty
  useEffect(() => {
    const hasCategories = categories && (
      (Array.isArray(categories) && categories.length > 0) ||
      (typeof categories === 'object' && Object.keys(categories).length > 0)
    );
    
    if (!hasCategories && !isLoading) {
      dispatch(maybeFetchCategories());
    }
  }, [categories, isLoading, dispatch]);

  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category-images`)
      .then((res) => res.json())
      .then((data) => {
        const imagesMap: Record<string, string> = {};
        data.forEach((cat: { name: string; image: string }) => {
          imagesMap[cat.name] = cat.image;
        });
        setCategoryImages(imagesMap);
      })
      .catch((err) => console.error('Error fetching category images:', err));
  }, []);

  // Show loading state while fetching
  if (isLoading || !categories) {
    return (
      <main className="min-h-screen container mx-auto pt-36 md:pt-40 p-6" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600">טוען קטגוריות...</p>
        </div>
      </main>
    );
  }

  // Show error only if not loading and still no categories
  if (categoriesArray.length === 0) {
    return (
      <main className="min-h-screen container mx-auto pt-36 md:pt-40 p-6" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600">קטגוריות לא זמינות.</p>
          <p className="text-sm text-gray-500 mt-2">
            Debug: categories type = {Array.isArray(categories) ? 'Array' : typeof categories}
          </p>
        </div>
      </main>
    );
  }

  const currentCategory = categoriesArray.find(
    (category: any) => {
      return category.categoryName === categoryName || 
             category.categoryName?.trim() === categoryName?.trim();
    }
  );

  if (!currentCategory) {
    return (
      <main className="min-h-screen container mx-auto pt-36 md:pt-40 p-6" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            לא נמצאה קטגוריה בשם "{categoryName}".
          </p>
          <p className="text-sm text-gray-500">
            קטגוריות זמינות: {categoriesArray.map((cat: any) => cat.categoryName).join(', ')}
          </p>
        </div>
      </main>
    );
  }

  const isDigitalCatalogCategory = categoryName === 'קטלוגים דיגיטלים להורדה';
  const subCategories = currentCategory.subCategories || [];
  const products = currentCategory.products || [];

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: companyName || 'טמבור', href: '/' },
    { label: categoryName }
  ];

  return (
    <main className="min-h-screen container mx-auto pt-36 md:pt-40 p-6" dir="rtl">
      <Breadcrumbs items={breadcrumbItems} />
      
      <header className="bg-white shadow-lg rounded-xl p-8 text-center border border-gray-200">
        {categoryName !== 'קטלוגים דיגיטלים להורדה' && (
          <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-gray-300 pb-2 inline-block">
            {categoryName}
          </h1>
        )}

        {!isDigitalCatalogCategory && subCategories.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6" aria-label="תת-קטגוריות">
            {subCategories.map((subcategory: any, index: number) => {
              const href = buildCategoryUrl(
                companyName || 'טמבור',
                currentCategory.categoryName,
                subcategory.subCategoryName
              );
              const imageSrc = categoryImages[`${currentCategory.categoryName} - ${subcategory.subCategoryName}`] ||
                subcategory.products?.[0]?.תמונות ||
                '/placeholder-product.png';

              return (
                <article
                  key={index}
                  className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition-all hover:scale-105 flex flex-col items-center"
                >
                  <Link href={href} className="flex flex-col items-center w-full">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-300 hover:border-primary transition">
                    <Image
                      src={imageSrc}
                      alt={`${subcategory.subCategoryName} - ${currentCategory.categoryName} | לבן גרופ חומרי בניין`}
                      title={`קטגוריה: ${subcategory.subCategoryName}`}
                      fill
                      priority={index < 4}
                      className="object-cover hover:brightness-110 transition-all duration-300"
                      sizes="(max-width: 640px) 128px, 128px"
                    />
                  </div>
                  <p className="mt-3 text-lg font-semibold text-gray-800">
                    {subcategory.subCategoryName}
                  </p>
                  </Link>
                </article>
              );
            })}
          </section>
        )}
      </header>

      <section aria-label="מוצרים מקטגוריה זו" className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-gray-300 pb-2 inline-block">
          מוצרים מקטגוריה זו
        </h2>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6 justify-items-center bg-white shadow-lg rounded-xl p-8 border border-gray-200">
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
            לא נמצאו מוצרים או תתי קטגוריות בקטגוריה זו.
          </p>
        )}
      </section>
    </main>
  );
}

