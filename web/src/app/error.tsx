'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { buildCategoryUrl } from '@/lib/category-slugs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error);
  }, [error]);

  // Use canonical English slug URLs
  const paintsUrl = buildCategoryUrl('טמבור', 'צבעים וחומרי גמר');
  const gypsumUrl = buildCategoryUrl('טמבור', 'מוצרי גבס');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" dir="rtl">
      <div className="max-w-2xl w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-6 rounded-full">
            <AlertTriangle className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-white shadow-xl rounded-2xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">משהו השתבש</h1>
          <p className="text-gray-600 mb-6">
            אירעה שגיאה בלתי צפויה. אנחנו כבר עובדים על תיקון הבעיה.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
              <RefreshCw className="w-5 h-5" />
              נסה שוב
            </button>
            <Link
              href="/"
              title="חזור לדף הבית של לבן גרופ"
              className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-lg hover:bg-red-50 transition-colors font-semibold"
            >
              <Home className="w-5 h-5" />
              חזרה לדף הבית
            </Link>
          </div>
        </div>

        {/* Popular Categories */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">המשך לקטגוריות פופולריות:</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={paintsUrl}
              title="עבור לקטגוריית צבעים וחומרי גמר - מוצרים איכותיים"
              className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow border border-gray-200"
            >
              <span className="font-medium text-gray-800">צבעים וחומרי גמר</span>
            </Link>
            <Link
              href={gypsumUrl}
              title="עבור לקטגוריית גבס ומסלולים - מוצרים איכותיים"
              className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow border border-gray-200"
            >
              <span className="font-medium text-gray-800">גבס ומסלולים</span>
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-6 text-gray-600 text-sm">
          <p>
            אם הבעיה נמשכת, צור קשר: 
            <a 
              href="tel:050-5342813" 
              title="התקשר ללבן גרופ - 050-5342813"
              className="text-primary font-semibold hover:underline mr-2"
            >
              050-5342813
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

