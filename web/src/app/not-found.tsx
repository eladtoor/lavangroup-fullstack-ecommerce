import Link from 'next/link';
import { Metadata } from 'next';
import { Home, Search, Package, Phone, MapPin } from 'lucide-react';
import { buildCategoryUrl } from '@/lib/category-slugs';

export const metadata: Metadata = {
  title: 'דף לא נמצא (404)',
  description: 'הדף שחיפשת לא נמצא. חזרה לדף הבית לקטלוג חומרי בניין, צבעים, גבס ואביזרים',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  const popularCategories = [
    { name: 'צבעים לקירות פנים', href: buildCategoryUrl('טמבור', 'צבעים לקירות פנים'), icon: '🎨' },
    { name: 'מוצרי גבס', href: buildCategoryUrl('טמבור', 'מוצרי גבס'), icon: '🏗️' },
    { name: 'חומרי הכנה ומילוי', href: buildCategoryUrl('טמבור', 'חומרי הכנה ומילוי'), icon: '🧱' },
    { name: 'קטלוגים דיגיטלים להורדה', href: buildCategoryUrl('טמבור', 'קטלוגים דיגיטלים להורדה'), icon: '📚' },
  ];

  const quickLinks = [
    { name: 'חיפוש מוצרים', href: '/search?query=', icon: Search },
    { name: 'ימי חלוקה', href: '/delivery-days', icon: MapPin },
    { name: 'תנאי שימוש', href: '/terms', icon: Package },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" dir="rtl">
      <div className="max-w-4xl w-full text-center">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <div className="text-4xl font-bold text-gray-800 mt-4">הדף לא נמצא</div>
        </div>

        {/* Main Message */}
        <div className="bg-white shadow-xl rounded-2xl p-8 mb-8">
          <p className="text-xl text-gray-700 mb-4">
            מצטערים, הדף שחיפשת אינו קיים או הועבר למיקום אחר
          </p>
          <p className="text-gray-600 mb-6">
            אולי תרצה לחפש <strong>חומרי בניין</strong>, <strong>צבעים טמבור</strong>, 
            <strong> גבס</strong> או <strong>דבקים</strong> בחנות שלנו?
          </p>

          {/* Back to Home Button */}
          <Link
            href="/"
            title="חזור לדף הבית של לבן גרופ"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors text-lg font-semibold"
          >
            <Home className="w-5 h-5" />
            חזרה לדף הבית
          </Link>
        </div>

        {/* Popular Categories */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">קטגוריות פופולריות</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {popularCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                title={`עבור לקטגוריית ${category.name} - מוצרים איכותיים במחירים מיוחדים`}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 border border-gray-200"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <div className="font-semibold text-gray-800">{category.name}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">קישורים שימושיים</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  title={`עבור ל${link.name}`}
                  className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="font-medium text-gray-800">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-gray-600">
          <p className="mb-2">זקוק לעזרה? צור איתנו קשר:</p>
          <div className="flex items-center justify-center gap-2 text-primary font-semibold">
            <Phone className="w-4 h-4" />
            <a href="tel:050-5342813" className="hover:underline">
              050-5342813
            </a>
          </div>
        </div>

        {/* Keywords Footer */}
        <div className="mt-8 text-sm text-gray-500 border-t pt-6">
          <p>
            <strong>לבן גרופ</strong> - חומרי בניין ושיפוצים | צבעים | גבס | דבקים וטייח | 
            אביזרים | משלוחים לכל הארץ
          </p>
        </div>
      </div>
    </div>
  );
}

