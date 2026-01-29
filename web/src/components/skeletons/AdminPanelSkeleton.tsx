export default function AdminPanelSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 pt-24 md:pt-32" dir="rtl">
      {/* Title */}
      <div className="h-10 bg-gray-300 rounded w-64 mx-auto mb-8"></div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-10 bg-gray-300 rounded w-32"></div>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="h-10 bg-gray-300 rounded"></div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-100 border-b p-4">
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-5 bg-gray-300 rounded flex-1"></div>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4 p-4">
              {Array.from({ length: 6 }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

