import ProductCardSkeleton from './ProductCardSkeleton';

interface ProductListSkeletonProps {
  count?: number;
}

export default function ProductListSkeleton({ count = 8 }: ProductListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

