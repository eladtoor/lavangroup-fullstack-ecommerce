import TableSkeleton from '@/components/skeletons/TableSkeleton';

export default function Loading() {
  return (
    <div className="p-6 md:p-40 text-center mt-20">
      <div className="h-8 bg-gray-300 rounded w-96 mx-auto mb-6"></div>
      <TableSkeleton rows={10} columns={5} />
    </div>
  );
}

