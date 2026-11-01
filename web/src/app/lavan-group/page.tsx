import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { FaPhoneAlt } from 'react-icons/fa';
import { SectionHead, Bullets, Photo, ContactBand, PHONE_DISPLAY, PHONE_INTL, type Img } from './_ui';

/*
 * LAVAN Group — the group page (/lavan-group).
 * Israel: the "לבן" paint & building-materials store, LAVAN Group Development & Drilling
 * (soil investigation), and private & commercial real-estate development.
 * Poland: LAVAN PL Sp. z o.o. (full page at /lavan-group/poland). Germany: LAVAN De GmbH.
 * Typography and palette come from ./layout.tsx + ./lavan.css. Images are pre-compressed WebP.
 */

const PAGE_PATH = '/lavan-group';
const PAGE_TITLE = 'LAVAN Group – צבעים, בדיקות קרקע ונדל"ן בישראל, פולין וגרמניה';
const PAGE_DESCRIPTION =
  'LAVAN Group פועלת בישראל, בפולין ובגרמניה: בית המסחר "לבן" לצבעים וחומרי בניין, לבן גרופ: פיתוח וקידוח – בדיקות קרקע בכל הארץ, ויזמות נדל"ן פרטי ומסחרי.';

const IL = '/images/lavan-group/israel';
const PL = '/images/lavan-group/poland';

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
    images: [{ url: `${IL}/herzliya-private-house-night.webp`, width: 1600, height: 855, alt: 'LAVAN Group' }],
  },
};

const HERZLIYA: Img[] = [
  { src: `${IL}/herzliya-private-house-day.webp`, alt: 'הדמיית בית פרטי של LAVAN בהרצליה – חזית ביום', w: 1600, h: 855 },
  { src: `${IL}/herzliya-private-house-night.webp`, alt: 'הדמיית בית פרטי של LAVAN בהרצליה – חזית בערב', w: 1600, h: 855 },
];

const DRILLING: Img[] = [
  { src: `${IL}/drilling-rig-side.webp`, alt: 'מכונת קידוח לבדיקות קרקע של לבן גרופ: פיתוח וקידוח', w: 1200, h: 800 },
  { src: `${IL}/drilling-rig-mast.webp`, alt: 'מכונת הקידוח של לבן גרופ: פיתוח וקידוח עם תורן מורם', w: 900, h: 1351 },
];

const DRILLING_POINTS = ['בדיקות קרקע בכל חלקי הארץ', 'מורשה משרד הביטחון', 'עבודה במכרזים ממשלתיים'];

const POLAND_SERVICES = [
  'איתור, השבחה ובנייה של פרויקטים למגורים ולמסחר',
  'דירות להשקעה להשכרה לתקופות קצרות וארוכות',
  'ניהול נכסים',
  'רכישה והשבחה של נכסים',
];

const POLAND_PROJECTS = [
  { id: 'kato', name: 'LAVAN KATO', text: 'מלון דירות מניב · קטוביץ' },
  { id: 'widok12', name: 'LAVAN WIDOK 12', text: 'מגורים בוטיק · קטוביץ' },
  { id: 'gliwice', name: 'LAVAN GLIWICE', text: '24 דירות · הושלם ואוכלס' },
  { id: 'zabrze', name: 'Roosevelta 22 – LAVAN', text: '24 דירות · הושלם ואוכלס' },
];

const GERMANY_SERVICES = ['רכישה והשבחה של בנייני מגורים', 'שיווק ומכירה של דירות להשקעה מניבות'];

export default function LavanGroupPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';

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
        { '@type': 'Store', name: 'לבן – צבעים וחומרי בניין', url: baseUrl, telephone: PHONE_INTL },
        {
          '@type': 'LocalBusiness',
          name: 'לבן גרופ: פיתוח וקידוח',
          description: 'בדיקות קרקע בכל חלקי הארץ. מורשה משרד הביטחון, עבודה במכרזים ממשלתיים.',
          url: `${baseUrl}${PAGE_PATH}#drilling`,
          telephone: PHONE_INTL,
          image: `${baseUrl}${IL}/drilling-rig-side.webp`,
          areaServed: { '@type': 'Country', name: 'Israel' },
        },
        { '@type': 'Organization', name: 'LAVAN PL Sp. z o.o.', url: `${baseUrl}/lavan-group/poland` },
        { '@type': 'Organization', name: 'LAVAN De GmbH', url: `${baseUrl}${PAGE_PATH}#germany` },
      ],
    },
  ];

  return (
    <main dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-36 md:pt-40">
        <Breadcrumbs items={[{ label: 'דף הבית', href: '/' }, { label: 'LAVAN Group' }]} />
      </div>

      {/* Hero */}
      <header className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden bg-[var(--lv-ink)] min-h-[440px] sm:min-h-[520px] flex items-end">
          <Image
            src={`${IL}/herzliya-private-house-night.webp`}
            alt=""
            aria-hidden="true"
            fill
            priority
            unoptimized
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--lv-ink)] via-[var(--lv-ink)]/60 to-transparent" />
          <div className="relative w-full px-6 sm:px-12 pb-10 sm:pb-14 pt-24 text-white">
            <p className="lv-latin text-sm text-[var(--lv-gold)]" dir="ltr" style={{ textAlign: 'right' }}>
              LAVAN GROUP
            </p>
            <h1 className="lv-serif mt-3 text-4xl sm:text-6xl leading-[1.1]">ישראל · פולין · גרמניה</h1>
            <span className="lv-rule mt-6" aria-hidden="true" />
            <p className="mt-6 max-w-2xl text-base sm:text-lg font-light leading-relaxed text-white/85">
              בישראל – צבעים וחומרי בניין, בדיקות קרקע ויזמות נדל&quot;ן פרטי ומסחרי. בפולין ובגרמניה – איתור,
              רכישה, השבחה ובנייה של נכסי מגורים ומסחר, דירות להשקעה וניהול נכסים.
            </p>
            <nav aria-label="מדינות הפעילות" className="mt-8 flex flex-wrap gap-3">
              <a href="#israel" className="lv-btn-ghost">ישראל</a>
              <Link href="/lavan-group/poland" className="lv-btn-ghost">פולין</Link>
              <a href="#germany" className="lv-btn-ghost">גרמניה</a>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Israel ── */}
      <section id="israel" className="scroll-mt-40 mx-auto max-w-6xl px-4 sm:px-6 py-20" aria-labelledby="israel-heading">
        <SectionHead id="israel-heading" kicker="ISRAEL" title="ישראל" />

        {/* Store */}
        <article className="lv-card grid md:grid-cols-[1fr_auto] gap-6 items-center p-8 sm:p-10">
          <div>
            <p className="lv-kicker" dir="ltr" style={{ textAlign: 'right' }}>01 · PAINTS &amp; BUILDING MATERIALS</p>
            <h3 className="lv-serif mt-3 text-2xl sm:text-3xl text-[var(--lv-ink)]">לבן – צבעים וחומרי בניין</h3>
            <p className="mt-3 max-w-2xl text-[var(--lv-muted)] font-light leading-relaxed">
              בית מסחר לצבעים וחומרי בניין לקבלנים, לחברות בנייה ולבונים פרטיים, עם אספקה ישירה לאתר.
            </p>
          </div>
          <Link href="/" title="לחנות הצבעים וחומרי הבניין של לבן" className="lv-btn-dark">
            לחנות
          </Link>
        </article>

        {/* Drilling */}
        <article id="drilling" className="scroll-mt-40 lv-card mt-6 grid lg:grid-cols-2 overflow-hidden">
          <div className="p-8 sm:p-10 flex flex-col">
            <p className="lv-kicker" dir="ltr" style={{ textAlign: 'right' }}>02 · DEVELOPMENT &amp; DRILLING</p>
            <h3 className="lv-serif mt-3 text-2xl sm:text-3xl text-[var(--lv-ink)]">לבן גרופ: פיתוח וקידוח</h3>
            <div className="mt-6">
              <Bullets items={DRILLING_POINTS} />
            </div>
            <div className="mt-8">
              <a href={`tel:${PHONE_INTL}`} title={`לבן גרופ: פיתוח וקידוח – ${PHONE_DISPLAY}`} className="lv-btn">
                <FaPhoneAlt aria-hidden="true" />
                <span dir="ltr">{PHONE_DISPLAY}</span>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-px bg-[var(--lv-line)] min-h-[280px]">
            <Photo img={DRILLING[0]} className="col-span-3" />
            <Photo img={DRILLING[1]} className="col-span-2" />
          </div>
        </article>

        {/* Real-estate development */}
        <article id="development" className="scroll-mt-40 mt-6">
          <div className="lv-card p-8 sm:p-10 border-b-0">
            <p className="lv-kicker" dir="ltr" style={{ textAlign: 'right' }}>03 · REAL ESTATE DEVELOPMENT</p>
            <h3 className="lv-serif mt-3 text-2xl sm:text-3xl text-[var(--lv-ink)]">יזמות נדל&quot;ן</h3>
            <p className="mt-3 text-[var(--lv-muted)] font-light leading-relaxed">ייזום פרויקטים של נדל&quot;ן פרטי ומסחרי.</p>
          </div>
          <div className="lv-card overflow-hidden">
            <div className="grid md:grid-cols-2 gap-px bg-[var(--lv-line)]">
              <Photo img={HERZLIYA[0]} className="aspect-[16/9]" />
              <Photo img={HERZLIYA[1]} className="aspect-[16/9]" />
            </div>
            <div className="p-6 sm:p-8 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--lv-muted)]">פרויקטים פרטיים</p>
                <h4 className="lv-serif text-xl sm:text-2xl text-[var(--lv-ink)]">בתים פרטיים – הרצליה</h4>
              </div>
              <p className="text-xs text-[var(--lv-muted)]">תכנון: אדריכל גדי פוליטי · הדמיות: OneViz Studio</p>
            </div>
          </div>
        </article>
      </section>

      {/* ── Poland ── */}
      <section id="poland" className="scroll-mt-40 bg-[var(--lv-sand)]" aria-labelledby="poland-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <SectionHead id="poland-heading" kicker="LAVAN PL SP. Z O.O." title="פולין" />
            <Bullets items={POLAND_SERVICES} />
            <ul className="mt-10 grid sm:grid-cols-2 gap-px bg-[var(--lv-line)] border border-[var(--lv-line)]">
              {POLAND_PROJECTS.map((p) => (
                <li key={p.id} className="bg-white">
                  <Link href={`/lavan-group/poland#${p.id}`} className="block p-5 hover:bg-[var(--lv-cream)] transition">
                    <span className="lv-latin block text-lg text-[var(--lv-ink)]" dir="ltr" style={{ textAlign: 'right' }}>
                      {p.name}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--lv-muted)]">{p.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/lavan-group/poland" title="LAVAN PL – נדל״ן להשקעה בפולין" className="lv-btn mt-8">
              לעמוד LAVAN PL
            </Link>
          </div>
          <Link href="/lavan-group/poland#kato" className="block">
            <Photo
              img={{ src: `${PL}/kato-facade-evening.webp`, alt: 'LAVAN KATO – מלון דירות מניב בקטוביץ', w: 1200, h: 900 }}
              className="aspect-[4/3] shadow-xl"
            />
          </Link>
        </div>
      </section>

      {/* ── Germany ── */}
      <section id="germany" className="scroll-mt-40 mx-auto max-w-6xl px-4 sm:px-6 py-20" aria-labelledby="germany-heading">
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          <SectionHead id="germany-heading" kicker="LAVAN DE GMBH" title="גרמניה" />
          <div className="lv-card p-8 sm:p-10">
            <Bullets items={GERMANY_SERVICES} />
          </div>
        </div>
      </section>

      <ContactBand title="יצירת קשר עם LAVAN Group" />
    </main>
  );
}
