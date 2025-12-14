export default function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-48 bg-gray-300"></div>
      
      {/* Content Skeleton */}
      <div className="p-6">
        {/* Title */}
        <div className="h-8 bg-gray-300 rounded w-3/4 mx-auto"></div>
      </div>
    </div>
  );
}

