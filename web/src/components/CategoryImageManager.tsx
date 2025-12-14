'use client';

import { useEffect, useState } from 'react';
import { uploadImageToCloudinary } from '@/lib/utils/cloudinaryUpload';

interface SubCategory {
  subCategoryName: string;
}

interface Category {
  categoryName: string;
  subCategories?: SubCategory[];
}

interface CategoryImageManagerProps {
  organizedCategories: Category[];
}

export default function CategoryImageManager({ organizedCategories }: CategoryImageManagerProps) {
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    // Fetch existing category images
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category-images`)
      .then((res) => res.json())
      .then((data) => {
        const imagesMap: Record<string, string> = {};
        data.forEach((cat: { name: string; image: string }) => {
          imagesMap[cat.name] = cat.image;
        });
        setCategoryImages(imagesMap);
      })
      .catch((error) => {
        console.error('Error fetching category images:', error);
      });
  }, []);

  const handleImageUpload = async (categoryName: string, file: File) => {
    if (!file) return;

    try {
      setUploading(categoryName);
      const imageUrl = await uploadImageToCloudinary(file);

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName, image: imageUrl }),
      });

      setCategoryImages((prev) => ({ ...prev, [categoryName]: imageUrl }));
      alert('תמונה עודכנה בהצלחה לקטגוריה!');
    } catch (error) {
      console.error('❌ שגיאה בהעלאת תמונה לקטגוריה:', error);
      alert('שגיאה בהעלאה');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-10" dir="rtl">
      {organizedCategories.map((category) => (
        <div key={category.categoryName} className="space-y-4">
          {/* קטגוריה ראשית */}
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 border rounded overflow-hidden relative">
              {categoryImages[category.categoryName] ? (
                <img
                  src={categoryImages[category.categoryName]}
                  alt={`${category.categoryName} - ניהול תמונות קטגוריה | לבן גרופ`}
                  title={category.categoryName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  אין תמונה
                </div>
              )}
              {uploading === category.categoryName && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-lg">{category.categoryName}</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && handleImageUpload(category.categoryName, e.target.files[0])
                }
                disabled={uploading === category.categoryName}
                className="text-sm"
              />
            </div>
          </div>

          {/* תתי קטגוריות */}
          {category.subCategories?.map((sub) => {
            const subCategoryKey = `${category.categoryName} - ${sub.subCategoryName}`;
            return (
              <div key={sub.subCategoryName} className="flex items-center gap-4 mr-12">
                <div className="w-20 h-20 border rounded overflow-hidden relative">
                  {categoryImages[subCategoryKey] ? (
                    <img
                      src={categoryImages[subCategoryKey]}
                      alt={`${sub.subCategoryName} - ${category.categoryName} - ניהול תמונות | לבן גרופ`}
                      title={`${category.categoryName} > ${sub.subCategoryName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                      אין תמונה
                    </div>
                  )}
                  {uploading === subCategoryKey && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{sub.subCategoryName}</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files?.[0] && handleImageUpload(subCategoryKey, e.target.files[0])
                    }
                    disabled={uploading === subCategoryKey}
                    className="text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
