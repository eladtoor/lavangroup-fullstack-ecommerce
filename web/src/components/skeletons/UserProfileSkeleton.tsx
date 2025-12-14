export default function UserProfileSkeleton() {
  return (
    <div className="min-h-screen mb-32 font-sans mt-24 md:mt-32 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto animate-pulse">
        {/* Breadcrumb */}
        <div className="flex gap-2 mb-4">
          <div className="h-4 bg-gray-300 rounded w-20"></div>
          <div className="h-4 bg-gray-300 rounded w-4"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>

        {/* Profile Header */}
        <div className="bg-gradient-to-r from-red-400 to-red-500 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/30 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-white/30 rounded w-48"></div>
              <div className="h-5 bg-white/20 rounded w-64"></div>
              <div className="flex gap-2">
                <div className="h-7 bg-white/30 rounded w-20"></div>
                <div className="h-7 bg-white/30 rounded w-24"></div>
              </div>
            </div>
            <div className="h-12 bg-white/30 rounded w-32"></div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-6 bg-gray-300 rounded w-32 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index}>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-12 bg-gray-100 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-6 bg-gray-300 rounded w-32 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index}>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-12 bg-gray-100 rounded"></div>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index}>
                    <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="h-12 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

