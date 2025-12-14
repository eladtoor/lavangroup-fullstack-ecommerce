import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'ימי חלוקה',
  description: 'ימי חלוקה ומשלוחים לכל הארץ - לבן גרופ',
  alternates: {
    canonical: '/delivery-days',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DeliveryDays() {
  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'ימי חלוקה' }
  ];

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'בית',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'ימי חלוקה',
        item: `${baseUrl}/delivery-days`,
      },
    ],
  };

  const deliveryData = [
    { area: 'אילת', days: 'ראשון, שלישי, חמישי' },
    { area: 'טבריה', days: 'שני, רביעי, שישי' },
    { area: 'קרית שמונה (גוש חלב)', days: 'שלישי, שישי' },
    { area: 'עפולה / נצרת / שפרעם', days: 'שני עד שישי' },
    { area: 'בית שאן והעמקים', days: 'שני, רביעי, שישי' },
    { area: 'חיפה', days: 'ראשון עד חמישי' },
    { area: 'חיפה והקריות', days: 'ראשון עד חמישי' },
    { area: 'אריאל / ברקן / בית שמש', days: 'ראשון, שלישי, חמישי' },
    { area: 'גוש עציון', days: 'ראשון, רביעי' },
    { area: 'שאר הארץ', days: 'ראשון עד חמישי' },
  ];

  return (
        <main className="min-h-screen max-w-4xl mx-auto px-4 pt-40 pb-20" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 border-b-2 border-red-600 inline-block pb-2 font-serif">
        ימי חלוקה - טמבור
      </h1>
      </header>
      <section className="bg-gray-50 rounded-lg shadow-md p-6">
        <p className="text-lg text-gray-700 mb-6 text-center font-sans">
          הזמנות שיוזמנו עד השעה 15:00 יסופקו ביום שלמחרת בהתאם לימי אספקה ובכפוף לזמינות מלאי, לרשימת הזמנות קודמות ובימי עבודה עסקיים.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-right text-gray-700 font-sans">אזור</th>
                <th className="py-3 px-4 text-right text-gray-700 font-sans">ימי חלוקה</th>
              </tr>
            </thead>
            <tbody>
              {deliveryData.map((item, index) => (
                <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-right font-sans">{item.area}</td>
                  <td className="py-3 px-4 text-right font-sans">{item.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
        </main>
  );
}
