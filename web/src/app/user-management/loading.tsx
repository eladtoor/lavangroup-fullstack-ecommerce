import TableSkeleton from '@/components/skeletons/TableSkeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 pt-24 md:pt-32" dir="rtl">
      <div className="h-10 bg-gray-300 rounded w-64 mb-6"></div>
      
      {/* Filter Tabs */}
      <div className="flex gap-4 mb-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-10 bg-gray-300 rounded w-24"></div>
        ))}
      </div>

      <TableSkeleton rows={10} columns={7} />
    </div>
  );
}

