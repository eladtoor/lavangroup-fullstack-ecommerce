import ProductListSkeleton from '@/components/skeletons/ProductListSkeleton';

export default function Loading() {
  return (
    <div className="container mx-auto mt-24 p-6" dir="rtl">
      {/* Breadcrumb Skeleton */}
      <div className="flex gap-2 mb-4 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-20"></div>
        <div className="h-4 bg-gray-300 rounded w-4"></div>
        <div className="h-4 bg-gray-300 rounded w-32"></div>
        <div className="h-4 bg-gray-300 rounded w-4"></div>
        <div className="h-4 bg-gray-300 rounded w-32"></div>
      </div>
      
      {/* Title Skeleton */}
      <div className="mb-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      
      {/* Products Grid */}
      <ProductListSkeleton count={12} />
    </div>
  );
}

