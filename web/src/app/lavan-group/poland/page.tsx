import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import {
  FaSearchLocation,
  FaDraftingCompass,
  FaHardHat,
  FaKey,
  FaChartLine,
  FaCheck,
  FaPhoneAlt,
  FaWhatsapp,
  FaCube,
} from 'react-icons/fa';

/*
 * LAVAN PL Sp. z o.o. — Poland page (/lavan-group/poland).
 * Hebrew page aimed at Israeli investors: what LAVAN PL does, the projects, and how to invest.
 * Project facts come from the owner's materials (unit cards, architectural concept, 3D models).
 * Images: pre-compressed WebP in /public/images/lavan-group/poland, served unoptimized.
 */

const PAGE_PATH = '/lavan-group/poland';
const PAGE_TITLE = 'LAVAN PL – נדל"ן להשקעה בפולין: קטוביץ, גליביצה וזברז\'ה';
const PAGE_DESCRIPTION =
  'LAVAN PL Sp. z o.o. – איתור, השבחה ובנייה של פרויקטים למגורים ולמסחר בשלזיה, פולין: LAVAN KATO, LAVAN WIDOK 12 ופרויקטים בגליביצה ובזברז\'ה. דירות להשקעה להשכרה קצרה וארוכה וניהול נכסים.';

const PHONE_DISPLAY = '050-5342813';
const PHONE_INTL = '+972505342813';
const IMG = '/images/lavan-group/poland';
const KATO_3D_MODEL_URL = 'https://claude.ai/artifact/6ZzLpydtUWYneDQMpYZXTN';

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
    images: [{ url: `${IMG}/kato-facade-evening.webp`, width: 1200, height: 900, alt: 'LAVAN KATO, קטוביץ' }],
  },
};

const PILLARS = [
  {
    icon: FaSearchLocation,
    title: 'איתור',
    text: 'אנחנו מאתרים קרקעות ומבנים בערים מרכזיות בשלזיה, ובודקים בכל נכס תכנון, רישוי, ביקוש לשכירות ופוטנציאל השבחה, לפני שמתחייבים.',
  },
  {
    icon: FaDraftingCompass,
    title: 'תכנון והשבחה',
    text: 'מתאימים את התכנון לשימוש המניב ביותר: יחידות קומפקטיות להשכרה, שטחי מסחר בקומת הקרקע, דירות גן ודירות גג.',
  },
  {
    icon: FaHardHat,
    title: 'בנייה בניהול עצמי',
    text: 'הקבוצה פועלת כקבלן ראשי בפרויקטים שלה, כך שהשליטה על לוחות הזמנים, התקציב ואיכות הביצוע נשארת אצלנו.',
  },
  {
    icon: FaKey,
    title: 'השכרה וניהול',
    text: 'השכרה לטווח קצר ולטווח ארוך, תפעול שוטף, שירות לדיירים ולאורחים ודיווח למשקיע. המשקיע מקבל נכס מנוהל, לא רק מפתח.',
  },
  {
    icon: FaChartLine,
    title: 'רכישה והשבחה',
    text: 'רכישה של נכסים קיימים, שיפוץ והתאמה לשוק השכירות, והחזקה לטווח ארוך או מכירה.',
  },
];

const WHY_POLAND = [
  'שוק נדל"ן בתוך האיחוד האירופי, עם רישום מקרקעין מסודר (Księga wieczysta) ומערכת משפטית יציבה.',
  'מטרופולין שלזיה – קטוביץ, גליביצה וזברז\'ה – אזור עירוני גדול ורציף, עם אוניברסיטאות, תעשייה ומשרדים.',
  'ביקוש קבוע לדירות להשכרה מצד סטודנטים, עובדים צעירים ואנשי עסקים.',
  'מחירי כניסה נמוכים משמעותית ממחירי הנדל"ן בישראל ובמערב אירופה.',
];

const INVESTOR_PATHS = [
  {
    title: 'רכישת דירה להשקעה',
    text: 'דירה בודדת, או כמה דירות, בפרויקט של הקבוצה, עם רישום נפרד בטאבו ואפשרות להעביר אותה לניהול LAVAN להשכרה קצרה או ארוכה.',
  },
  {
    title: 'רכישת קומה שלמה',
    text: 'למשקיעים שמחפשים היקף גדול יותר: קומה שלמה בפרויקט, עם רישום נפרד לכל יחידה.',
  },
  {
    title: 'שותפות בפרויקט',
    text: 'כניסה כשותף בחברת הפרויקט. התנאים נקבעים בהסכם פרטני לכל פרויקט.',
  },
];

type Project = {
  id: string;
  name: string;
  city: string;
  address: string;
  tagline: string;
  facts: string[];
  text: string;
  images: { src: string; alt: string; w: number; h: number }[];
  link?: { href: string; label: string };
};

const PROJECTS: Project[] = [
  {
    id: 'kato',
    name: 'LAVAN KATO',
    city: 'קטוביץ',
    address: 'ul. 1 Maja 2',
    tagline: 'מלון דירות מניב במרכז קטוביץ',
    facts: [
      '26 יחידות דיור להשכרה',
      'סטודיו מאובזרים, 13–23 מ"ר',
      'לוגיות ומרפסות גג בחלק מהיחידות',
      'Café & Lounge של 63 מ"ר בקומת הקרקע',
      'אכלוס מתוכנן: 2027',
    ],
    text: 'בניין חדש שנבנה מראש כמלון דירות. היחידות קומפקטיות ומאובזרות במלואן, ומיועדות להשכרה לטווח קצר ולטווח ארוך. בקומת הקרקע יש בית קפה ולאונג\' בסגנון לובי מלון, עם עמדת עבודה משותפת, שמשרת גם את הדיירים וגם את הרחוב.',
    images: [
      { src: `${IMG}/kato-facade-evening.webp`, alt: 'LAVAN KATO – חזית הבניין בערב, ul. 1 Maja 2 קטוביץ', w: 1200, h: 900 },
      { src: `${IMG}/kato-cafe-interior.webp`, alt: 'LAVAN KATO – בית הקפה והלאונג\' בקומת הקרקע', w: 1070, h: 900 },
      { src: `${IMG}/kato-cafe-plan.webp`, alt: 'LAVAN KATO – תכנית העמדה של בית הקפה', w: 1355, h: 935 },
    ],
    link: { href: KATO_3D_MODEL_URL, label: 'סיור במודל תלת-ממד' },
  },
  {
    id: 'widok12',
    name: 'LAVAN WIDOK 12',
    city: 'קטוביץ',
    address: 'Katowice',
    tagline: 'אור, מרחב ושקט',
    facts: [
      '20 דירות ב-5 קומות',
      '2–5 חדרים',
      'דירות גן עם גינה פרטית',
      'דירות גג דו-מפלסיות עם אנטרסולה ומרפסת גג',
      'חניון תת-קרקעי, 25 מקומות',
    ],
    text: 'פרויקט מגורים בוטיק בגמרים טבעיים: פרקט אלון, אבן גיר בהירה, פליז מוברש ומטבחים בגוון גרפיט. מגוון הדירות פונה למשפחות, לזוגות צעירים ולמשקיעים.',
    images: [
      { src: `${IMG}/widok12-apartment-card.webp`, alt: 'LAVAN WIDOK 12 – כרטיס דירה 16: 2 חדרים, 59.21 מ"ר עם מרפסת ואנטרסולה', w: 1536, h: 1024 },
    ],
  },
  {
    id: 'gliwice',
    name: 'LAVAN GLIWICE',
    city: 'גליביצה',
    address: 'ul. Ossolińskich',
    tagline: 'בניין מגורים עם חניון תת-קרקעי',
    facts: [
      '24 דירות',
      '4 קומות מעל חניון תת-קרקעי',
      '22 חניות תת-קרקעיות',
      'כ-3,000 מ"ר בנוי, על מגרש של 1,354 מ"ר',
      '40% מהמגרש שטח ירוק',
    ],
    text: 'בניין מגורים בשכונת מגורים שקטה בגליביצה, עם מרפסות לכל הדירות, חצרות פרטיות בקומת הקרקע וחניון תת-קרקעי.',
    images: [
      { src: `${IMG}/gliwice-render-1.webp`, alt: 'הדמיית פרויקט LAVAN בגליביצה, ul. Ossolińskich', w: 1176, h: 713 },
      { src: `${IMG}/gliwice-render-2.webp`, alt: 'הדמיית פרויקט LAVAN בגליביצה – מבט פינתי', w: 1400, h: 839 },
    ],
  },
  {
    id: 'zabrze',
    name: 'Roosevelta 22',
    city: 'זברז\'ה',
    address: 'ul. Roosevelta 22, Zabrze',
    tagline: 'מגורים מעל חזית מסחרית',
    facts: ['בניין מגורים בן 4 קומות', 'קומת קרקע מסחרית', 'מרפסות גג'],
    text: 'בניין מגורים בעיצוב עכשווי בזברז\'ה, עיר במטרופולין שלזיה הצמודה לגליביצה ולקטוביץ.',
    images: [
      { src: `${IMG}/zabrze-photo.webp`, alt: 'הבניין ב-ul. Roosevelta 22, זברז\'ה – צילום מהשטח', w: 1400, h: 790 },
      { src: `${IMG}/zabrze-render.webp`, alt: 'הדמיית הבניין ב-ul. Roosevelta 22, זברז\'ה', w: 1155, h: 628 },
      { src: `${IMG}/zabrze-aerial.webp`, alt: 'הדמיית מבט על של מרפסת הגג – Roosevelta 22, זברז\'ה', w: 1095, h: 817 },
    ],
  },
];

function SectionTitle({ id, kicker, title, lead }: { id: string; kicker: string; title: string; lead?: string }) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="text-sm font-semibold tracking-widest text-primary" dir="ltr" style={{ textAlign: 'right' }}>
        {kicker}
      </p>
      <h2 id={id} className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">
        {title}
      </h2>
      {lead && <p className="mt-3 text-gray-700 text-base sm:text-lg leading-relaxed">{lead}</p>}
    </div>
  );
}

function ProjectBlock({ p, flip }: { p: Project; flip: boolean }) {
  const [main, ...rest] = p.images;
  return (
    <article id={p.id} className="scroll-mt-40 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className={`grid grid-cols-1 lg:grid-cols-2 ${flip ? 'lg:[direction:ltr]' : ''}`}>
        <div className="bg-gray-100 [direction:rtl]">
          <Image src={main.src} alt={main.alt} width={main.w} height={main.h} unoptimized className="w-full h-full object-cover" />
        </div>
        <div className="p-6 sm:p-8 [direction:rtl]">
          <p className="text-sm text-gray-500">
            {p.city} · <span dir="ltr">{p.address}</span>
          </p>
          <h3 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900" dir="ltr" style={{ textAlign: 'right' }}>
            {p.name}
          </h3>
          <p className="mt-1 text-lg font-semibold text-primary">{p.tagline}</p>
          <p className="mt-4 text-gray-700 leading-relaxed">{p.text}</p>
          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {p.facts.map((f) => (
              <li key={f} className="flex items-start gap-2 text-gray-800 text-sm sm:text-base">
                <FaCheck className="mt-1 shrink-0 text-primary" aria-hidden="true" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {p.link && (
            <a
              href={p.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-white font-semibold hover:bg-gray-700 transition"
            >
              <FaCube aria-hidden="true" />
              {p.link.label}
            </a>
          )}
        </div>
      </div>
      {rest.length > 0 && (
        <div className={`grid gap-1 bg-gray-200 ${rest.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {rest.map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.w}
              height={img.h}
              unoptimized
              className={`w-full object-cover ${rest.length > 1 ? 'aspect-[4/3]' : 'aspect-[21/9]'}`}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export default function LavanPolandPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'LAVAN Group', href: '/lavan-group' },
    { label: 'פולין – LAVAN PL' },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'בית', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'LAVAN Group', item: `${baseUrl}/lavan-group` },
        { '@type': 'ListItem', position: 3, name: 'LAVAN PL', item: `${baseUrl}${PAGE_PATH}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'LAVAN PL Sp. z o.o.',
      url: `${baseUrl}${PAGE_PATH}`,
      logo: `${baseUrl}/logo.png`,
      description: PAGE_DESCRIPTION,
      parentOrganization: { '@type': 'Organization', name: 'LAVAN Group', url: `${baseUrl}/lavan-group` },
      areaServed: { '@type': 'Country', name: 'Poland' },
      telephone: PHONE_INTL,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'פרויקטים של LAVAN PL בפולין',
      itemListElement: PROJECTS.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Residence',
          name: p.name,
          description: p.text,
          url: `${baseUrl}${PAGE_PATH}#${p.id}`,
          image: `${baseUrl}${p.images[0].src}`,
          address: { '@type': 'PostalAddress', streetAddress: p.address, addressCountry: 'PL' },
        },
      })),
    },
  ];

  return (
    <main className="min-h-screen pt-36 md:pt-40 mb-5 max-w-6xl mx-auto px-4 sm:px-6" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl bg-gray-900 text-white shadow-lg">
        <Image
          src={`${IMG}/kato-facade-evening.webp`}
          alt=""
          aria-hidden="true"
          fill
          unoptimized
          priority
          className="object-cover opacity-30"
        />
        <div className="relative px-6 py-12 sm:px-12 sm:py-16">
          <p className="text-sm font-semibold tracking-widest text-yellow-400" dir="ltr" style={{ textAlign: 'right' }}>
            LAVAN PL SP. Z O.O. · 🇵🇱
          </p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-bold leading-tight">
            נדל&quot;ן מניב בפולין,
            <br /> מהקרקע ועד ניהול הנכס
          </h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-gray-100 leading-relaxed">
            LAVAN PL מאתרת, משביחה ובונה פרויקטים למגורים ולמסחר בקטוביץ, בגליביצה ובזברז&apos;ה, ומנהלת אותם
            עבור המשקיעים. חברה אחת אחראית על כל שלבי הפרויקט.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="#projects"
              className="inline-flex justify-center rounded-lg bg-primary px-6 py-3 font-semibold hover:bg-primary-600 transition"
            >
              לפרויקטים
            </a>
            <a
              href="#invest"
              className="inline-flex justify-center rounded-lg border border-white px-6 py-3 font-semibold hover:bg-white hover:text-gray-900 transition"
            >
              איך משקיעים
            </a>
          </div>
          <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            {[
              { v: '4', l: 'פרויקטים' },
              { v: '3', l: 'ערים בשלזיה' },
              { v: '70+', l: 'יחידות דיור' },
              { v: 'מקצה לקצה', l: 'איתור → ניהול' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-white/10 backdrop-blur px-3 py-3 text-center">
                <dd className="text-xl sm:text-2xl font-bold">{s.v}</dd>
                <dt className="text-xs sm:text-sm text-gray-200">{s.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* What we do */}
      <section className="mt-16" aria-labelledby="what-heading">
        <SectionTitle
          id="what-heading"
          kicker="WHAT WE DO"
          title="מה LAVAN PL עושה"
          lead="משקיעים בחו״ל נתקלים בדרך כלל באותן בעיות: קשה לבחור נכס מרחוק, קשה לפקח על הבנייה, וקשה לנהל שוכרים. אצלנו כל השלבים האלה נמצאים בידי אותה חברה."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PILLARS.map(({ icon: Icon, title, text }, i) => (
            <article key={title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <Icon className="text-primary text-2xl" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-lg font-bold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="mt-16 scroll-mt-40" aria-labelledby="projects-heading">
        <SectionTitle id="projects-heading" kicker="PROJECTS" title="הפרויקטים שלנו" />
        <nav aria-label="פרויקטים" className="mb-6 flex flex-wrap gap-2">
          {PROJECTS.map((p) => (
            <a
              key={p.id}
              href={`#${p.id}`}
              className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-semibold text-gray-800 hover:border-primary hover:text-primary transition"
            >
              <span dir="ltr">{p.name}</span> · {p.city}
            </a>
          ))}
        </nav>
        <div className="space-y-8">
          {PROJECTS.map((p, i) => (
            <ProjectBlock key={p.id} p={p} flip={i % 2 === 1} />
          ))}
        </div>
      </section>

      {/* Managed apartments */}
      <section className="mt-16" aria-labelledby="managed-heading">
        <SectionTitle
          id="managed-heading"
          kicker="MANAGED APARTMENTS"
          title="דירות להשקעה בניהול LAVAN"
          lead="אנחנו מנהלים דירות להשכרה לתקופות קצרות וארוכות: עיצוב והתאמה לשוכרים, פרסום, קבלת אורחים, ניקיון ותחזוקה, ודיווח שוטף לבעלים."
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Image
            src={`${IMG}/apartment-bedroom.webp`}
            alt="חדר שינה בדירה להשקעה בניהול LAVAN בפולין"
            width={900}
            height={1200}
            unoptimized
            className="w-full aspect-[3/4] object-cover rounded-xl shadow-sm"
          />
          <Image
            src={`${IMG}/apartment-bathroom.webp`}
            alt="חדר רחצה בדירה להשקעה בניהול LAVAN בפולין"
            width={900}
            height={1200}
            unoptimized
            className="w-full aspect-[3/4] object-cover rounded-xl shadow-sm"
          />
          <div className="col-span-2 rounded-xl bg-gray-50 border border-gray-200 p-6 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-gray-900">מה כולל הניהול</h3>
            <ul className="mt-4 space-y-2">
              {['השכרה לטווח קצר (Booking ופלטפורמות נוספות) או לטווח ארוך', 'קבלת אורחים, ניקיון ותחזוקה', 'גבייה, חשבוניות ודיווח חודשי לבעלים', 'צוות מקומי בפולין, ובעלים שאפשר לדבר איתם בעברית'].map((t) => (
                <li key={t} className="flex items-start gap-2 text-gray-800">
                  <FaCheck className="mt-1 shrink-0 text-primary" aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Why Poland */}
      <section className="mt-16 rounded-2xl bg-gray-50 border border-gray-200 p-6 sm:p-10" aria-labelledby="why-heading">
        <SectionTitle id="why-heading" kicker="WHY SILESIA" title="למה פולין, ולמה שלזיה" />
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WHY_POLAND.map((t) => (
            <li key={t} className="flex items-start gap-3 rounded-xl bg-white p-4 border border-gray-200 text-gray-800">
              <FaCheck className="mt-1 shrink-0 text-primary" aria-hidden="true" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Investor paths */}
      <section id="invest" className="mt-16 scroll-mt-40" aria-labelledby="invest-heading">
        <SectionTitle id="invest-heading" kicker="INVEST WITH US" title="איך משקיעים עם LAVAN PL" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {INVESTOR_PATHS.map((p, i) => (
            <article key={p.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <span className="text-4xl font-bold text-primary-200">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-xl font-bold text-gray-900">{p.title}</h3>
              <p className="mt-2 text-gray-700 leading-relaxed">{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mt-16 rounded-2xl bg-gray-900 text-white p-6 sm:p-10" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-2xl sm:text-3xl font-bold">רוצים לשמוע על הפרויקטים בפולין?</h2>
        <p className="mt-3 text-gray-300 max-w-2xl">
          השאירו פרטים או דברו איתנו ישירות. נשלח לכם את כרטיסי הדירות, המחירים והמבנה המשפטי של ההשקעה.
        </p>
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
            href={`https://wa.me/972505342813?text=${encodeURIComponent('שלום, אשמח לפרטים על פרויקטי LAVAN PL בפולין')}`}
            target="_blank"
            rel="noopener noreferrer"
            title="שיחת וואטסאפ עם LAVAN PL"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white px-6 py-3 font-semibold hover:bg-white hover:text-gray-900 transition"
          >
            <FaWhatsapp aria-hidden="true" />
            וואטסאפ
          </a>
        </div>
      </section>

      <p className="mt-6 text-xs text-gray-500 leading-relaxed">
        ההדמיות להמחשה בלבד. המידע בעמוד זה הוא כללי, ואינו מהווה הצעה לציבור, ייעוץ השקעות או התחייבות לתשואה.
        התנאים המחייבים הם אלה שייקבעו בהסכם בכתב.
      </p>

      <div className="mt-6">
        <Link href="/lavan-group" className="text-primary font-semibold hover:underline">
          → חזרה ל-LAVAN Group
        </Link>
      </div>
    </main>
  );
}
