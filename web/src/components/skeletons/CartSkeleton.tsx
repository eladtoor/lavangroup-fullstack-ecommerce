export default function CartSkeleton() {
  return (
    <div className="min-h-screen w-full px-4 md:px-10 pt-16 md:pt-24 mt-10 animate-pulse">
      {/* Title */}
      <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        {/* Cart Items Section */}
        <div className="w-full md:w-2/3 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-300 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
            <div className="h-12 bg-gray-300 rounded mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

