import ProductListSkeleton from '@/components/skeletons/ProductListSkeleton';

export default function Loading() {
  return (
    <div className="max-w-screen-lg mx-auto mt-24 p-4 sm:p-6 min-h-screen" dir="rtl">
      {/* Breadcrumb Skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="h-4 bg-gray-300 rounded w-20"></div>
        <div className="h-4 bg-gray-300 rounded w-4"></div>
        <div className="h-4 bg-gray-300 rounded w-32"></div>
      </div>
      
      {/* Search Title Skeleton */}
      <div className="text-center mb-6">
        <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto"></div>
      </div>
      
      {/* Results Grid */}
      <ProductListSkeleton count={9} />
    </div>
  );
}

