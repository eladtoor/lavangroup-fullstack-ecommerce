import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import {
  FaTools,
  FaHardHat,
  FaChartLine,
  FaKey,
  FaPaintRoller,
  FaDrawPolygon,
} from 'react-icons/fa';

/*
 * LAVAN Group — the group page.
 * Presents the store ("לבן") as one arm of a wider real-estate, development and
 * construction group operating in Israel, Poland and Germany.
 *
 * Content lives in the constants below so it can be edited without touching the layout.
 */

const PAGE_PATH = '/lavan-group';
const PAGE_TITLE = 'LAVAN Group – ייזום, בנייה ונדל"ן בישראל, פולין וגרמניה';
const PAGE_DESCRIPTION =
  'LAVAN Group היא קבוצת נדל"ן, ייזום ובנייה הפועלת בישראל, פולין וגרמניה – יזם, קבלן ראשי ומשקיע. לקבוצה שייכים בית המסחר "לבן" לצבעים וחומרי בניין ועסק קידוחי קרקע בישראל.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  robots: { index: true, follow: true },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_PATH,
    type: 'website',
    locale: 'he_IL',
  },
};

const STATS = [
  { value: '3', label: 'מדינות פעילות' },
  { value: '6', label: 'תחומי פעילות' },
  { value: 'מקצה לקצה', label: 'מקרקע ועד מפתח' },
];

const ACTIVITIES = [
  {
    icon: FaDrawPolygon,
    title: 'ייזום נדל"ן',
    text: 'איתור קרקעות ונכסים, בדיקות היתכנות, תכנון ורישוי – והובלת הפרויקט מהרעיון ועד האכלוס.',
  },
  {
    icon: FaHardHat,
    title: 'ביצוע ובנייה',
    text: 'הקבוצה פועלת כקבלן ראשי בפרויקטים שלה: ניהול קבלני משנה, לוחות זמנים, תקציב ואיכות ביצוע באתר.',
  },
  {
    icon: FaChartLine,
    title: 'השקעות והשבחה',
    text: 'רכישה והשבחה של בנייני מגורים קיימים, שיפוץ, שינוי ייעוד והחזקה לטווח ארוך.',
  },
  {
    icon: FaKey,
    title: 'ניהול נכסים והשכרה',
    text: 'ניהול דירות להשכרה לטווח ארוך וקצר, כולל תפעול שוטף ושירות לדיירים ולאורחים.',
  },
  {
    icon: FaPaintRoller,
    title: 'אספקת חומרי בניין',
    text: 'בית המסחר "לבן" – צבעים וחומרי בניין לקבלנים, לחברות בנייה ולבונים פרטיים, באספקה ישירה לאתר.',
  },
];

const COUNTRIES = [
  {
    flag: '🇮🇱',
    name: 'ישראל',
    points: [
      'ייזום פרויקטים למגורים',
      'בית המסחר "לבן" – צבעים וחומרי בניין בפריסה ארצית',
      'קידוחי קרקע לפרויקטים בבנייה ובתשתיות',
    ],
  },
  {
    flag: '🇵🇱',
    name: 'פולין',
    points: [
      'ייזום ובנייה של בנייני מגורים בשלזיה (קטוביץ, גליביצה)',
      'בנייה להשכרה ודירות להשכרה לטווח קצר',
      'ניהול נכסים מקומי',
    ],
  },
  {
    flag: '🇩🇪',
    name: 'גרמניה',
    points: [
      'רכישה והשבחה של בנייני מגורים קיימים',
      'שיפוץ, פיצול ושיווק יחידות',
      'החזקה וניהול לטווח ארוך',
    ],
  },
];

// Selected projects shown on the page. Only projects the owner approved for public display.
const PROJECTS = [
  {
    name: 'LAVAN KATO',
    location: 'ul. 1 Maja 2, קטוביץ, פולין',
    text: 'בניין מגורים חדש עם 26 יחידות דיור ושטח מסחרי בקומת הקרקע, ובו בית קפה, לובי וחדר כביסה משותף. אכלוס מתוכנן ב-2027.',
  },
  {
    name: 'LAVAN WIDOK 12',
    location: 'קטוביץ, פולין',
    text: 'פרויקט מגורים בתכנון אדריכלי עכשווי, הכולל דירות גן ומגוון סוגי דירות.',
  },
];

export default function LavanGroupPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'LAVAN Group' },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'בית', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'LAVAN Group', item: `${baseUrl}${PAGE_PATH}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'LAVAN Group',
      alternateName: ['לבן גרופ', 'Lavangroup'],
      url: `${baseUrl}${PAGE_PATH}`,
      logo: `${baseUrl}/logo.png`,
      description: PAGE_DESCRIPTION,
      areaServed: [
        { '@type': 'Country', name: 'Israel' },
        { '@type': 'Country', name: 'Poland' },
        { '@type': 'Country', name: 'Germany' },
      ],
      knowsAbout: ['ייזום נדל"ן', 'בנייה', 'השקעות נדל"ן', 'ניהול נכסים', 'חומרי בניין', 'קידוחי קרקע'],
      subOrganization: [
        {
          '@type': 'Store',
          name: 'לבן – צבעים וחומרי בניין',
          url: baseUrl,
          telephone: '+972-50-534-2813',
          email: 'Lavan1414@gmail.com',
          areaServed: { '@type': 'Country', name: 'Israel' },
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen pt-36 md:pt-40 mb-5 max-w-6xl mx-auto px-4 sm:px-6" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero */}
      <header className="rounded-2xl bg-gray-900 text-white px-6 py-10 sm:px-12 sm:py-14 shadow-lg">
        <p className="text-sm font-semibold tracking-widest text-yellow-400">LAVAN GROUP</p>
        <h1 className="mt-3 text-3xl sm:text-5xl font-bold leading-tight">
          ייזום, בנייה ונדל&quot;ן
          <br className="hidden sm:block" /> בישראל, פולין וגרמניה
        </h1>
        <p className="mt-5 max-w-3xl text-base sm:text-lg text-gray-200 leading-relaxed">
          LAVAN Group היא קבוצה שפועלת בכל שלבי הנדל&quot;ן: מאיתור הקרקע, דרך התכנון והבנייה, ועד ההשכרה
          והניהול השוטף. בקבוצה אנחנו גם היזם, גם הקבלן וגם המשקיע. בית המסחר &quot;לבן&quot; לצבעים וחומרי
          בניין ועסק קידוחי הקרקע הם חלק מהקבוצה.
        </p>
        <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 px-4 py-4 text-center">
              <dt className="text-sm text-gray-300">{s.label}</dt>
              <dd className="mt-1 text-2xl font-bold text-white">{s.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Activities */}
      <section className="mt-12" aria-labelledby="activities-heading">
        <h2 id="activities-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 border-b-4 border-primary pb-3 inline-block">
          תחומי הפעילות
        </h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ACTIVITIES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <Icon className="text-primary text-3xl" aria-hidden="true" />
              <h3 className="mt-3 text-xl font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-gray-700 leading-relaxed">{text}</p>
            </article>
          ))}
          <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <FaTools className="text-primary text-3xl" aria-hidden="true" />
            <h3 className="mt-3 text-xl font-semibold text-gray-900">קידוחי קרקע</h3>
            <p className="mt-2 text-gray-700 leading-relaxed">
              עסק חדש בקבוצה בישראל: קידוחי קרקע לפרויקטים בבנייה ובתשתיות, עם ציוד מקצועי וצוות מנוסה.
            </p>
          </article>
        </div>
      </section>

      {/* Countries */}
      <section className="mt-12" aria-labelledby="countries-heading">
        <h2 id="countries-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 border-b-4 border-primary pb-3 inline-block">
          איפה אנחנו פועלים
        </h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {COUNTRIES.map((c) => (
            <article key={c.name} className="rounded-xl bg-gray-50 border border-gray-200 p-6">
              <h3 className="text-2xl font-bold text-gray-900">
                <span aria-hidden="true">{c.flag}</span> {c.name}
              </h3>
              <ul className="mt-4 space-y-2 list-disc pr-5 text-gray-700">
                {c.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="mt-12" aria-labelledby="projects-heading">
        <h2 id="projects-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 border-b-4 border-primary pb-3 inline-block">
          פרויקטים נבחרים
        </h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {PROJECTS.map((p) => (
            <article key={p.name} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900" dir="ltr" style={{ textAlign: 'right' }}>
                {p.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{p.location}</p>
              <p className="mt-3 text-gray-700 leading-relaxed">{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Why it matters for store customers */}
      <section className="mt-12 rounded-2xl bg-primary-50 border border-primary-100 p-6 sm:p-10" aria-labelledby="why-heading">
        <h2 id="why-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">
          למה זה חשוב לך כלקוח של &quot;לבן&quot;?
        </h2>
        <ul className="mt-5 space-y-3 text-gray-800 text-base sm:text-lg leading-relaxed list-disc pr-5">
          <li>
            <strong>אנחנו בונים בעצמנו.</strong> אנחנו בוחרים את החומרים שאנחנו מוכרים כמו שאנחנו בוחרים אותם
            לפרויקטים שלנו, לפי מה שעובד באתר הבנייה.
          </li>
          <li>
            <strong>מבינים מפרטים ולוחות זמנים.</strong> כקבלן ראשי אנחנו יודעים מה המשמעות של אספקה שמתעכבת או
            של חומר שלא מתאים למפרט.
          </li>
          <li>
            <strong>כוח קנייה של קבוצה.</strong> היקפי הרכש של הקבוצה מאפשרים לנו להציע מחירי קבלן גם ללקוחות
            פרטיים.
          </li>
        </ul>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            title="לחנות חומרי הבניין של לבן"
            className="inline-flex justify-center rounded-lg bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-600 transition"
          >
            לחנות חומרי הבניין
          </Link>
          <a
            href="https://wa.me/972505342813"
            target="_blank"
            rel="noopener noreferrer"
            title="שיחת וואטסאפ עם LAVAN Group"
            className="inline-flex justify-center rounded-lg border border-gray-900 px-6 py-3 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition"
          >
            דברו איתנו בוואטסאפ
          </a>
        </div>
      </section>
    </main>
  );
}
