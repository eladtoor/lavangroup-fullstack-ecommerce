import TableSkeleton from '@/components/skeletons/TableSkeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 pt-24 md:pt-32" dir="rtl">
      <div className="h-10 bg-gray-300 rounded w-64 mx-auto mb-8"></div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-md">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-12"></div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-10 bg-gray-300 rounded w-24"></div>
        ))}
      </div>

      <TableSkeleton rows={12} columns={6} />
    </div>
  );
}

