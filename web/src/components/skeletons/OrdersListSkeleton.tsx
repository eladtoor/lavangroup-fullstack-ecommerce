export default function OrdersListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 pt-24 md:pt-32 animate-pulse" dir="rtl">
      {/* Title */}
      <div className="h-10 bg-gray-300 rounded w-64 mx-auto mb-8"></div>

      {/* Orders List */}
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-gray-300 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-8 bg-gray-300 rounded w-24"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>

            <div className="flex gap-2 mt-4">
              <div className="h-10 bg-gray-300 rounded flex-1"></div>
              <div className="h-10 bg-gray-300 rounded flex-1"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

