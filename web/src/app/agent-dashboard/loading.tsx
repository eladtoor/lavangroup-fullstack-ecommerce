import TableSkeleton from '@/components/skeletons/TableSkeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 pt-24 md:pt-32" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-6 md:p-10">
        <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-6"></div>
        
        <TableSkeleton rows={8} columns={4} />
      </div>
    </div>
  );
}

