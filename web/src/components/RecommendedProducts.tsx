'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAppSelector } from '@/lib/redux/hooks';
import ProductCard from './ProductCard';
import { Sparkles } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function RecommendedProducts() {
  const products = useAppSelector((state) => state.products.products);
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const featuredDoc = await getDoc(doc(db, 'settings', 'featuredProducts'));
        if (featuredDoc.exists()) {
          setFeaturedProductIds(featuredDoc.data().productIds || []);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
      }
    };
    fetchFeaturedProducts();
  }, []);

  // Get featured products or fallback to random
  const displayedProducts = useMemo(() => {
    if (!products.length) return [];

    // Filter products that have a price greater than 0 AND an image
    const completeProducts = products.filter(
      (product) =>
        product['מחיר רגיל'] &&
        Number(product['מחיר רגיל']) > 0 &&
        product['תמונות'] &&
        product['תמונות'].trim() !== ''
    );

    // If we have featured products, use them
    if (featuredProductIds.length > 0) {
      const featured = completeProducts.filter((product) =>
        featuredProductIds.includes(product._id)
      );
      // If we have featured products, return them (up to 10)
      if (featured.length > 0) {
        return featured.slice(0, 10);
      }
    }

    // Fallback to random products if no featured products selected
    const shuffled = [...completeProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  }, [products, featuredProductIds]);

  // Don't render if no products available
  if (displayedProducts.length === 0) {
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
          {displayedProducts.map((product, index) => (
            <ProductCard key={product._id} product={product} priority={index < 5} />
          ))}
        </div>
      </div>
    </div>
  );
}
