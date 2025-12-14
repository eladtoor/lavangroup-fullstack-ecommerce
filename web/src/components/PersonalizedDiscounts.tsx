'use client';

import { useAppSelector } from '@/lib/redux/hooks';
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { Tag, Percent } from 'lucide-react';

export default function PersonalizedDiscounts() {
  const user = useAppSelector((state) => state.user?.user);
  const products = useAppSelector((state) => state.products.products);
  const [discountedProducts, setDiscountedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.productDiscounts && user.productDiscounts.length > 0) {
      // Get products that have discounts for this user
      const userDiscountedProducts = products.filter((product) =>
        user.productDiscounts.some((discount: any) => discount.productId === product._id)
      );

      // Add discount info to each product
      const productsWithDiscounts = userDiscountedProducts.map((product) => {
        const discountInfo = user.productDiscounts.find(
          (discount: any) => discount.productId === product._id
        );
        return {
          ...product,
          userDiscount: discountInfo?.discount || 0,
        };
      });

      setDiscountedProducts(productsWithDiscounts);
    } else {
      setDiscountedProducts([]);
    }
  }, [user, products]);

  // Don't render if user is not logged in or has no personalized discounts
  if (!user || discountedProducts.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-green-200">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Tag className="w-8 h-8 text-green-600 animate-pulse" />
          <h2 className="text-3xl font-extrabold text-gray-900">
            המבצעים האישיים שלך
          </h2>
          <Percent className="w-8 h-8 text-green-600 animate-pulse" />
        </div>

        {/* Description */}
        <p className="text-center text-gray-700 mb-6 text-lg">
          מוצרים מיוחדים עם הנחה בלעדית עבורך! 🎁
        </p>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {discountedProducts.map((product, index) => (
            <ProductCard key={product._id} product={product} priority={index < 4} />
          ))}
        </div>

        {/* Footer Message */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            💚 ההנחות האישיות שלך מחכות לך - אל תפספס!
          </p>
        </div>
      </div>
    </div>
  );
}
