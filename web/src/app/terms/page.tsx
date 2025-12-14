import { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'תנאי שימוש ומדיניות פרטיות',
  description: 'תנאי השימוש ומדיניות הפרטיות של לבן גרופ. קראו על זכויותיכם, החזרות, אבטחת מידע ועוד',
  alternates: {
    canonical: '/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPrivacy() {
  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'תנאי שימוש ומדיניות פרטיות' }
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
        name: 'תנאי שימוש ומדיניות פרטיות',
        item: `${baseUrl}/terms`,
      },
    ],
  };

  return (
        <main className="min-h-screen pt-36 md:pt-40 mb-5 max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">תנאי שימוש ומדיניות פרטיות</h1>
      </header>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">1. מבוא</h2>
        <p className="text-gray-700">
          ברוכים הבאים ל"לבן בע"מ" – בית מסחר לצבעים וחומרי בניין מבית LAVAN Group. תנאי השימוש המפורטים להלן חלים על כל משתמשי האתר והאפליקציה שלנו (להלן: "האתר"). השימוש באתר מהווה הסכמה לכל תנאי השימוש, ולכן אנו ממליצים לקרוא אותם בעיון.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">2. כללי</h2>
        <ul className="list-disc pr-6 text-gray-700">
          <li>השימוש באתר מותר לכל אדם מעל גיל 18 או לחברה/עסק רשום.</li>
          <li>"לבן בע"מ" שומרת לעצמה את הזכות לשנות את תנאי השימוש מעת לעת.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">3. הזמנת מוצרים</h2>
        <ul className="list-disc pr-6 text-gray-700">
          <li>הזמנה באתר תתבצע באמצעות מילוי רשימת החומרים המבוקשים, הזנת כתובת וציון מועד אספקה רצוי.</li>
          <li>המחירים באתר כוללים מע"מ ואינם כוללים עלויות נוספות, אלא אם צוין אחרת.</li>
          <li>"לבן בע"מ" אינה מתחייבת למלאי זמין בכל עת.</li>
          <li>החברה שומרת לעצמה את הזכות לבטל הזמנה במקרה של טעות במחיר או בפרטי המוצר.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">4. ביטול עסקה והחזרות</h2>
        <ul className="list-disc pr-6 text-gray-700">
          <li>ניתן לבטל הזמנה בהתאם להוראות חוק הגנת הצרכן, בתוך 14 יום מרגע הרכישה, ובלבד שהמוצר לא נעשה בו שימוש והוא מוחזר באריזתו המקורית.</li>
          <li>החזר כספי יתבצע תוך 14 ימי עסקים לאמצעי התשלום שממנו בוצעה ההזמנה.</li>
          <li>לא ניתן להחזיר מוצרים שהותאמו אישית ללקוח.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">5. פרטיות ואבטחת מידע</h2>
        <ul className="list-disc pr-6 text-gray-700">
          <li>"לבן בע"מ" מתחייבת לשמור על פרטיות המשתמשים ולא להעביר מידע אישי לצד שלישי ללא אישור המשתמש, למעט אם נדרש לפי חוק.</li>
          <li>המשתמש רשאי לבקש גישה, תיקון או מחיקת המידע האישי שלו בכל עת באמצעות פנייה לשירות הלקוחות.</li>
          <li>האתר משתמש בטכנולוגיות אבטחה מתקדמות לשמירה על המידע האישי.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">6. אחריות ושירות</h2>
        <ul className="list-disc pr-6 text-gray-700">
          <li>"לבן בע"מ" אינה אחראית לנזק ישיר או עקיף שנגרם משימוש במוצרים שלא בהתאם להוראות השימוש.</li>
          <li>האחריות למוצרים ניתנת על ידי היצרן או היבואן ובהתאם למדיניותם.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">7. אמצעי תשלום וסליקה</h2>
        <ul className="list-disc pr-6 text-gray-700">
          <li>ניתן לשלם באתר באמצעות כרטיסי אשראי, ביט, העברה בנקאית ואמצעי תשלום נוספים בהתאם לזמינות.</li>
          <li>כל התשלומים מעובדים על ידי חברות סליקה חיצוניות העומדות בתקני אבטחת מידע (PCI DSS).</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">8. יצירת קשר</h2>
        <p className="text-gray-700">לשאלות ובירורים, ניתן לפנות אלינו:</p>
        <ul className="list-disc pr-6 text-gray-700">
          <li>📞 טלפון: 050-5342813</li>
          <li>📧 דוא"ל: <a href="mailto:Lavan1414@gmail.com" className="text-blue-600 hover:underline">Lavan1414@gmail.com</a></li>
          <li>📍 כתובת: הרצליה פיתוח, ישראל</li>
        </ul>
      </section>
        </main>
  );
}
