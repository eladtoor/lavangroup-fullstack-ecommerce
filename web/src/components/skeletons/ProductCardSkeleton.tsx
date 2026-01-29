export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image Skeleton */}
      <div className="w-full h-64 bg-gray-300"></div>
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        
        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        
        {/* Price */}
        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
        
        {/* Button */}
        <div className="h-10 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}

