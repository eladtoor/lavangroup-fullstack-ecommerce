import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { FaPaintRoller, FaTools, FaCity, FaPhoneAlt, FaWhatsapp, FaCheck } from 'react-icons/fa';

/*
 * LAVAN Group — the group page (/lavan-group).
 * Structure: Israel (store, soil-investigation drilling, real-estate development),
 * Poland (LAVAN PL Sp. z o.o.), Germany (LAVAN De GmbH).
 * Content lives in the constants below so it can be edited without touching the layout.
 * Images are pre-compressed WebP in /public/images/lavan-group and served unoptimized
 * (no runtime image processing on the 0.5-CPU Render instance).
 */

const PAGE_PATH = '/lavan-group';
const PAGE_TITLE = 'LAVAN Group – צבעים, בדיקות קרקע ונדל"ן בישראל, פולין וגרמניה';
const PAGE_DESCRIPTION =
  'LAVAN Group פועלת בישראל, בפולין ובגרמניה: בית המסחר "לבן" לצבעים וחומרי בניין, לבן גרופ: פיתוח וקידוח – בדיקות קרקע בכל הארץ, ויזמות נדל"ן למגורים ולמסחר.';

const PHONE_DISPLAY = '050-5342813';
const PHONE_INTL = '+972505342813';
const IMG = '/images/lavan-group';

const DRILLING_BADGES = ['מורשה משרד הביטחון', 'מכרזים ממשלתיים', 'עבודה בכל חלקי הארץ'];

const POLAND_SERVICES = [
  'איתור, השבחה ובנייה של פרויקטים למגורים ולמסחר',
  'דירות להשקעה להשכרה לתקופות קצרות וארוכות',
  'ניהול נכסים',
  'רכישה והשבחה של נכסים',
];

const POLAND_PROJECTS = [
  { name: 'LAVAN WIDOK 12', text: 'פרויקט מגורים בקטוביץ.' },
  { name: 'LAVAN KATO', text: 'מלון דירות מניב בקטוביץ – 26 יחידות ושטח מסחרי בקומת הקרקע.' },
];

const GERMANY_SERVICES = [
  'רכישה והשבחה של בנייני מגורים',
  'שיווק ומכירה של דירות להשקעה מניבות',
];

function SectionTitle({ id, kicker, title }: { id: string; kicker: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold tracking-widest text-primary" dir="ltr" style={{ textAlign: 'right' }}>
        {kicker}
      </p>
      <h2 id={id} className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">
        {title}
      </h2>
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-gray-800">
          <FaCheck className="mt-1 shrink-0 text-primary" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

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
      areaServed: ['Israel', 'Poland', 'Germany'].map((name) => ({ '@type': 'Country', name })),
      subOrganization: [
        {
          '@type': 'Store',
          name: 'לבן – צבעים וחומרי בניין',
          url: baseUrl,
          telephone: PHONE_INTL,
          areaServed: { '@type': 'Country', name: 'Israel' },
        },
        {
          '@type': 'LocalBusiness',
          name: 'לבן גרופ: פיתוח וקידוח',
          description: 'בדיקות קרקע בכל חלקי הארץ. מורשה משרד הביטחון ומשתתף במכרזים ממשלתיים.',
          url: `${baseUrl}${PAGE_PATH}#drilling`,
          telephone: PHONE_INTL,
          image: `${baseUrl}${IMG}/drilling-rig-side.webp`,
          areaServed: { '@type': 'Country', name: 'Israel' },
        },
        {
          '@type': 'Organization',
          name: 'LAVAN PL Sp. z o.o.',
          url: `${baseUrl}${PAGE_PATH}#poland`,
          areaServed: { '@type': 'Country', name: 'Poland' },
        },
        {
          '@type': 'Organization',
          name: 'LAVAN De GmbH',
          url: `${baseUrl}${PAGE_PATH}#germany`,
          areaServed: { '@type': 'Country', name: 'Germany' },
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
        <h1 className="mt-3 text-3xl sm:text-5xl font-bold leading-tight">ישראל · פולין · גרמניה</h1>
        <p className="mt-5 max-w-3xl text-base sm:text-lg text-gray-200 leading-relaxed">
          בישראל – צבעים וחומרי בניין, בדיקות קרקע ויזמות נדל&quot;ן פרטי ומסחרי. בפולין ובגרמניה – איתור,
          רכישה, השבחה ובנייה של נכסי מגורים ומסחר, דירות להשקעה וניהול נכסים.
        </p>
        <nav aria-label="מדינות הפעילות" className="mt-8 flex flex-wrap gap-3">
          {[
            { href: '#israel', label: '🇮🇱 ישראל' },
            { href: '#poland', label: '🇵🇱 פולין' },
            { href: '#germany', label: '🇩🇪 גרמניה' },
          ].map((l) => (
            <a key={l.href} href={l.href} className="rounded-full bg-white/10 px-5 py-2 font-semibold hover:bg-white/20 transition">
              {l.label}
            </a>
          ))}
        </nav>
      </header>

      {/* ── Israel ── */}
      <section id="israel" className="mt-14 scroll-mt-40" aria-labelledby="israel-heading">
        <SectionTitle id="israel-heading" kicker="ISRAEL" title="🇮🇱 ישראל" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
            <FaPaintRoller className="text-primary text-3xl" aria-hidden="true" />
            <h3 className="mt-3 text-xl font-bold text-gray-900">לבן – צבעים וחומרי בניין</h3>
            <p className="mt-2 text-gray-700 leading-relaxed flex-1">
              בית מסחר לצבעים וחומרי בניין לקבלנים, לחברות בנייה ולבונים פרטיים, עם אספקה ישירה לאתר.
            </p>
            <Link
              href="/"
              title="לחנות הצבעים וחומרי הבניין של לבן"
              className="mt-5 inline-flex justify-center rounded-lg bg-primary px-5 py-3 text-white font-semibold hover:bg-primary-600 transition"
            >
              לחנות
            </Link>
          </article>

          <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <FaCity className="text-primary text-3xl" aria-hidden="true" />
            <h3 className="mt-3 text-xl font-bold text-gray-900">יזמות נדל&quot;ן</h3>
            <p className="mt-2 text-gray-700 leading-relaxed">ייזום פרויקטים של נדל&quot;ן פרטי ומסחרי.</p>
          </article>
        </div>

        {/* Drilling */}
        <article id="drilling" className="mt-5 scroll-mt-40 rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-6 sm:p-8">
              <FaTools className="text-primary text-3xl" aria-hidden="true" />
              <h3 className="mt-3 text-2xl font-bold text-gray-900">לבן גרופ: פיתוח וקידוח</h3>
              <p className="mt-2 text-lg text-gray-800">בדיקות קרקע בכל חלקי הארץ.</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {DRILLING_BADGES.map((b) => (
                  <li key={b} className="rounded-full bg-white border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-800">
                    {b}
                  </li>
                ))}
              </ul>
              <a
                href={`tel:${PHONE_INTL}`}
                title={`התקשרו ללבן גרופ: פיתוח וקידוח – ${PHONE_DISPLAY}`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-white font-semibold hover:bg-gray-700 transition"
              >
                <FaPhoneAlt aria-hidden="true" />
                <span dir="ltr">{PHONE_DISPLAY}</span>
              </a>
            </div>
            <div className="grid grid-cols-5 gap-1 bg-gray-200">
              <Image
                src={`${IMG}/drilling-rig-side.webp`}
                alt="מכונת קידוח לבדיקות קרקע של לבן גרופ: פיתוח וקידוח – מבט צד"
                width={1200}
                height={800}
                unoptimized
                className="col-span-3 h-full w-full object-cover"
              />
              <Image
                src={`${IMG}/drilling-rig-mast.webp`}
                alt="מכונת הקידוח של לבן גרופ: פיתוח וקידוח עם תורן מורם"
                width={900}
                height={1351}
                unoptimized
                className="col-span-2 h-full w-full object-cover"
              />
            </div>
          </div>
        </article>
      </section>

      {/* ── Poland ── */}
      <section id="poland" className="mt-16 scroll-mt-40" aria-labelledby="poland-heading">
        <SectionTitle id="poland-heading" kicker="LAVAN PL SP. Z O.O." title="🇵🇱 פולין" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div>
            <CheckList items={POLAND_SERVICES} />
            <h3 className="mt-8 text-xl font-bold text-gray-900">פרויקטים</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {POLAND_PROJECTS.map((p) => (
                <article key={p.name} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h4 className="text-lg font-bold text-gray-900" dir="ltr" style={{ textAlign: 'right' }}>
                    {p.name}
                  </h4>
                  <p className="mt-2 text-gray-700">{p.text}</p>
                </article>
              ))}
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl shadow-md">
            <Image
              src={`${IMG}/poland-residential-building.webp`}
              alt="הדמיה של פרויקט מגורים של LAVAN בפולין"
              width={1176}
              height={713}
              unoptimized
              className="w-full h-auto"
            />
          </figure>
        </div>

        <h3 className="mt-10 text-xl font-bold text-gray-900">דירות להשקעה</h3>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Image
            src={`${IMG}/poland-apartment-bedroom.webp`}
            alt="חדר שינה בדירת השקעה מנוהלת של LAVAN בפולין"
            width={900}
            height={1200}
            unoptimized
            className="w-full aspect-[3/4] object-cover rounded-xl shadow-sm"
          />
          <Image
            src={`${IMG}/poland-apartment-bathroom.webp`}
            alt="חדר רחצה בדירת השקעה מנוהלת של LAVAN בפולין"
            width={900}
            height={1200}
            unoptimized
            className="w-full aspect-[3/4] object-cover rounded-xl shadow-sm"
          />
        </div>
      </section>

      {/* ── Germany ── */}
      <section id="germany" className="mt-16 scroll-mt-40" aria-labelledby="germany-heading">
        <SectionTitle id="germany-heading" kicker="LAVAN DE GMBH" title="🇩🇪 גרמניה" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <CheckList items={GERMANY_SERVICES} />
        </div>
      </section>

      {/* Contact */}
      <section className="mt-16 rounded-2xl bg-gray-900 text-white p-6 sm:p-10" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-2xl sm:text-3xl font-bold">יצירת קשר עם LAVAN Group</h2>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a
            href={`tel:${PHONE_INTL}`}
            title={`התקשרו – ${PHONE_DISPLAY}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold hover:bg-primary-600 transition"
          >
            <FaPhoneAlt aria-hidden="true" />
            <span dir="ltr">{PHONE_DISPLAY}</span>
          </a>
          <a
            href="https://wa.me/972505342813"
            target="_blank"
            rel="noopener noreferrer"
            title="שיחת וואטסאפ עם LAVAN Group"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white px-6 py-3 font-semibold hover:bg-white hover:text-gray-900 transition"
          >
            <FaWhatsapp aria-hidden="true" />
            וואטסאפ
          </a>
        </div>
      </section>
    </main>
  );
}
