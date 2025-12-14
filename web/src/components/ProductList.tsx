'use client';

import React from 'react';
import { useAppSelector } from '@/lib/redux/hooks';
import ProductCard from './ProductCard';
import { Product } from '@/lib/redux/reducers/productReducer';

interface ProductListProps {
  products?: Product[];
  limit?: number;
  isDigitalCatalog?: boolean;
}

export default function ProductList({
  products: propProducts,
  limit,
  isDigitalCatalog = false
}: ProductListProps) {
  const storeProducts = useAppSelector((state) => state.products.products);
  const loading = useAppSelector((state) => state.products.loading);
  const error = useAppSelector((state) => state.products.error);

  // Use prop products if provided, otherwise use store products
  const products = propProducts || storeProducts;
  const displayProducts = limit ? products.slice(0, limit) : products;

  if (loading) return <p className="text-center text-gray-600">טוען...</p>;
  if (error) return <p className="text-center text-red-500">שגיאה: {error}</p>;
  if (products.length === 0) {
    return <p className="text-center text-gray-500">לא נמצאו מוצרים</p>;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 justify-items-center">
        {displayProducts.map((product, index) => (
          <ProductCard
            key={product._id}
            product={product}
            priority={index < 5}
          />
        ))}
      </div>
    </div>
  );
}
