import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import LeadForm from '@/components/LeadForm';

const TITLE = 'ייעוץ טכני והצעת מחיר לקבלנים';
const DESCRIPTION =
  'השאירו פרטים לייעוץ טכני על צבע, איטום, גבס, דבקים, טיח וחומרי בניין, או להצעת מחיר לפי כמות. אספקה ישירה לאתר ומחירי קבלן.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/contact' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/contact', type: 'website', locale: 'he_IL' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-36 md:pt-40 pb-16 max-w-6xl mx-auto px-4 sm:px-6" dir="rtl">
      <Breadcrumbs items={[{ label: 'דף הבית', href: '/' }, { label: 'ייעוץ טכני' }]} />
      <div className="mt-2 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{TITLE}</h1>
          <p className="mt-4 text-lg text-gray-700 leading-relaxed">
            לא בטוחים איזה חומר מתאים לעבודה, או צריכים הצעת מחיר לכמות גדולה? השאירו פרטים קצרים – תחום, מוצר וכמות – ונחזור אליכם בהקדם.
          </p>
          <ul className="mt-6 space-y-3 text-gray-800">
            <li className="flex gap-3"><span className="text-orange-600 font-bold" aria-hidden="true">✓</span>התאמת חומר לעבודה: תשתית, תנאי חשיפה ודרישות המפרט</li>
            <li className="flex gap-3"><span className="text-orange-600 font-bold" aria-hidden="true">✓</span>הצעת מחיר לפי כתב כמויות, למחירי קבלן</li>
            <li className="flex gap-3"><span className="text-orange-600 font-bold" aria-hidden="true">✓</span>אספקה ישירה לאתר לפי <Link href="/delivery-days" className="underline">ימי החלוקה</Link></li>
          </ul>
          <div className="mt-8 rounded-2xl bg-gray-900 p-6 text-white">
            <p className="font-semibold">מעדיפים לדבר?</p>
            <p className="mt-2 text-gray-300">טלפון ווואטסאפ: <a href="tel:+972505342813" dir="ltr" className="font-bold text-white">050-5342813</a></p>
            <p className="mt-4 text-sm text-gray-400">רוצים לקרוא קודם? <Link href="/articles" className="underline text-gray-200">מדריכים מקצועיים</Link></p>
          </div>
        </div>
        <LeadForm source="consult" heading="השאירו פרטים" />
      </div>
    </div>
  );
}
