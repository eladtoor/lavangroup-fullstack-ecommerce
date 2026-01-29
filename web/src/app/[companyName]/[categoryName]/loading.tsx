import CategoryGridSkeleton from '@/components/skeletons/CategoryGridSkeleton';

export default function Loading() {
  return (
    <div className="container mx-auto mt-24 p-6" dir="rtl">
      {/* Breadcrumb Skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="h-4 bg-gray-300 rounded w-20"></div>
        <div className="h-4 bg-gray-300 rounded w-4"></div>
        <div className="h-4 bg-gray-300 rounded w-32"></div>
      </div>
      
      {/* Title Skeleton */}
      <div className="bg-white shadow-lg rounded-xl p-8 text-center border border-gray-200 mb-6">
        <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-6"></div>
      </div>
      
      {/* Categories Grid */}
      <CategoryGridSkeleton count={6} />
    </div>
  );
}

