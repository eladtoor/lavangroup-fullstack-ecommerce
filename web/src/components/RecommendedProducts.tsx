'use client';

import { useMemo } from 'react';
import { useAppSelector } from '@/lib/redux/hooks';
import ProductCard from './ProductCard';
import { Sparkles } from 'lucide-react';

export default function RecommendedProducts() {
  const products = useAppSelector((state) => state.products.products);

  // Get 10 random products that have a valid price and image
  const randomProducts = useMemo(() => {
    if (!products.length) return [];

    // Filter products that have a price greater than 0 AND an image
    const completeProducts = products.filter(
      (product) =>
        product['מחיר רגיל'] &&
        Number(product['מחיר רגיל']) > 0 &&
        product['תמונות'] &&
        product['תמונות'].trim() !== ''
    );

    // Shuffle and return 10 random products
    const shuffled = [...completeProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  }, [products]);

  // Don't render if no products available
  if (randomProducts.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          <h2 className="text-3xl font-extrabold text-gray-900">
            מוצרים מומלצים
          </h2>
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {randomProducts.map((product, index) => (
            <ProductCard key={product._id} product={product} priority={index < 5} />
          ))}
        </div>
      </div>
    </div>
  );
}
