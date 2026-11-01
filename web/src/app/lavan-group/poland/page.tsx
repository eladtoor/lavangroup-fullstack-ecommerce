import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { FaCube } from 'react-icons/fa';
import { SectionHead, Bullets, Photo, ContactBand, PHONE_INTL, type Img } from '../_ui';

/*
 * LAVAN PL Sp. z o.o. — Poland page (/lavan-group/poland).
 * Hebrew page aimed at Israeli investors: what LAVAN PL does, completed and current projects,
 * managed apartments, why Silesia, and how to invest.
 * Project facts come from the owner's materials (unit cards, architectural concept, 3D models)
 * and the owner's confirmations. Typography/palette: ../layout.tsx + ../lavan.css.
 */

const PAGE_PATH = '/lavan-group/poland';
const PAGE_TITLE = 'LAVAN PL – נדל"ן להשקעה בפולין: קטוביץ, גליביצה וזברז\'ה';
const PAGE_DESCRIPTION =
  'LAVAN PL Sp. z o.o. – איתור, השבחה ובנייה של פרויקטים למגורים ולמסחר בשלזיה, פולין. פרויקטים שהושלמו בגליביצה ובזברז\'ה, LAVAN KATO ו-LAVAN WIDOK 12 בקטוביץ, דירות להשקעה וניהול נכסים.';

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
  { n: '01', title: 'איתור', text: 'אנחנו מאתרים קרקעות ומבנים בערים מרכזיות בשלזיה, ובודקים בכל נכס תכנון, רישוי, ביקוש לשכירות ופוטנציאל השבחה, לפני שמתחייבים.' },
  { n: '02', title: 'תכנון והשבחה', text: 'מתאימים את התכנון לשימוש המניב ביותר: יחידות קומפקטיות להשכרה, שטחי מסחר בקומת הקרקע, דירות גן ודירות גג.' },
  { n: '03', title: 'בנייה בניהול עצמי', text: 'הקבוצה פועלת כקבלן ראשי בפרויקטים שלה, כך שהשליטה על לוחות הזמנים, התקציב ואיכות הביצוע נשארת אצלנו.' },
  { n: '04', title: 'השכרה וניהול', text: 'השכרה לטווח קצר ולטווח ארוך, תפעול שוטף, שירות לדיירים ולאורחים ודיווח למשקיע.' },
  { n: '05', title: 'רכישה והשבחה', text: 'רכישה של נכסים קיימים, שיפוץ והתאמה לשוק השכירות, והחזקה לטווח ארוך או מכירה.' },
];

const WHY_POLAND = [
  'שוק נדל"ן בתוך האיחוד האירופי, עם רישום מקרקעין מסודר (Księga wieczysta) ומערכת משפטית יציבה.',
  'מטרופולין שלזיה – קטוביץ, גליביצה וזברז\'ה – אזור עירוני גדול ורציף, עם אוניברסיטאות, תעשייה ומשרדים.',
  'ביקוש קבוע לדירות להשכרה מצד סטודנטים, עובדים צעירים ואנשי עסקים.',
  'מחירי כניסה נמוכים משמעותית ממחירי הנדל"ן בישראל ובמערב אירופה.',
];

const INVESTOR_PATHS = [
  { title: 'רכישת דירה להשקעה', text: 'דירה בודדת, או כמה דירות, בפרויקט של הקבוצה, עם רישום נפרד בטאבו ואפשרות להעביר אותה לניהול LAVAN להשכרה קצרה או ארוכה.' },
  { title: 'רכישת קומה שלמה', text: 'למשקיעים שמחפשים היקף גדול יותר: קומה שלמה בפרויקט, עם רישום נפרד לכל יחידה.' },
  { title: 'שותפות בפרויקט', text: 'כניסה כשותף בחברת הפרויקט. התנאים נקבעים בהסכם פרטני לכל פרויקט.' },
];

const MANAGEMENT = [
  'השכרה לטווח קצר (Booking ופלטפורמות נוספות) או לטווח ארוך',
  'קבלת אורחים, ניקיון ותחזוקה',
  'גבייה, חשבוניות ודיווח חודשי לבעלים',
  'צוות מקומי בפולין, ובעלים שאפשר לדבר איתם בעברית',
];

type Project = {
  id: string;
  name: string;
  city: string;
  address: string;
  status: string;
  tagline: string;
  text: string;
  facts: string[];
  images: Img[];
  link?: { href: string; label: string };
};

const COMPLETED: Project[] = [
  {
    id: 'gliwice',
    name: 'LAVAN GLIWICE',
    city: 'גליביצה',
    address: 'ul. Ossolińskich',
    status: 'הושלם ואוכלס',
    tagline: 'בניין מגורים עם חניון תת-קרקעי',
    text: 'בניין מגורים בשכונת מגורים שקטה בגליביצה, עם מרפסות לכל הדירות, חצרות פרטיות בקומת הקרקע וחניון תת-קרקעי.',
    facts: ['24 דירות', '4 קומות מעל חניון תת-קרקעי', '22 חניות תת-קרקעיות', 'כ-3,000 מ"ר בנוי על מגרש של 1,354 מ"ר'],
    images: [
      { src: `${IMG}/gliwice-render-1.webp`, alt: 'פרויקט LAVAN GLIWICE, ul. Ossolińskich, גליביצה', w: 1176, h: 713 },
      { src: `${IMG}/gliwice-render-2.webp`, alt: 'פרויקט LAVAN GLIWICE – מבט פינתי', w: 1400, h: 839 },
    ],
  },
  {
    id: 'zabrze',
    name: 'Roosevelta 22 – LAVAN',
    city: 'זברז\'ה',
    address: 'ul. Roosevelta 22, Zabrze',
    status: 'הושלם ואוכלס',
    tagline: 'מגורים מעל חזית מסחרית',
    text: 'בניין מגורים בעיצוב עכשווי בזברז\'ה, עיר במטרופולין שלזיה הצמודה לגליביצה ולקטוביץ. הפרויקט בוצע בשותפות LAVAN – Y.S investment.',
    facts: ['24 דירות', 'בניין בן 4 קומות', 'קומת קרקע מסחרית', 'מרפסות גג'],
    images: [
      { src: `${IMG}/zabrze-photo.webp`, alt: 'Roosevelta 22 – LAVAN, זברז\'ה – הבניין לאחר השלמה', w: 1400, h: 790 },
      { src: `${IMG}/zabrze-render.webp`, alt: 'Roosevelta 22 – LAVAN, זברז\'ה – הדמיית חזית', w: 1155, h: 628 },
      { src: `${IMG}/zabrze-aerial.webp`, alt: 'Roosevelta 22 – LAVAN, זברז\'ה – מבט על מרפסת הגג', w: 1095, h: 817 },
    ],
  },
];

const CURRENT: Project[] = [
  {
    id: 'kato',
    name: 'LAVAN KATO',
    city: 'קטוביץ',
    address: 'ul. 1 Maja 2',
    status: 'בבנייה · אכלוס 04.2027',
    tagline: 'מלון דירות מניב במרכז קטוביץ',
    text: 'בניין חדש שנבנה מראש כמלון דירות. היחידות קומפקטיות ומאובזרות במלואן, ומיועדות להשכרה לטווח קצר ולטווח ארוך. בקומת הקרקע יש בית קפה ולאונג\' בסגנון לובי מלון, עם עמדת עבודה משותפת, שמשרת גם את הדיירים וגם את הרחוב.',
    facts: ['26 דירות להשכרה', 'סטודיו מאובזרים, 13–23 מ"ר', 'לוגיות ומרפסות גג בחלק מהיחידות', 'Café & Lounge של 63 מ"ר בקומת הקרקע'],
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
    status: 'בשיווק · מסירה 05.2028',
    tagline: 'אור, מרחב ושקט',
    text: 'פרויקט מגורים בוטיק בגמרים טבעיים: פרקט אלון, אבן גיר בהירה, פליז מוברש ומטבחים בגוון גרפיט. מגוון הדירות פונה למשפחות, לזוגות צעירים ולמשקיעים.',
    facts: ['20 דירות ב-5 קומות', '2–5 חדרים', 'דירות גן עם גינה פרטית', 'דירות גג דו-מפלסיות עם מרפסת גג', 'חניון תת-קרקעי, 25 מקומות'],
    images: [
      { src: `${IMG}/widok12-apartment-card.webp`, alt: 'LAVAN WIDOK 12 – כרטיס דירה 16: 2 חדרים, 59.21 מ"ר עם מרפסת ואנטרסולה', w: 1536, h: 1024 },
    ],
  },
];

const ALL_PROJECTS = [...CURRENT, ...COMPLETED];

function ProjectBlock({ p, flip }: { p: Project; flip: boolean }) {
  const [main, ...rest] = p.images;
  return (
    <article id={p.id} className="scroll-mt-40 lv-card overflow-hidden">
      <div className={`grid lg:grid-cols-[1.15fr_1fr] ${flip ? 'lg:[direction:ltr]' : ''}`}>
        <Photo img={main} className="[direction:rtl] aspect-[4/3] lg:aspect-auto lg:min-h-[420px]" />
        <div className="[direction:rtl] p-8 sm:p-10 flex flex-col">
          <div className="flex flex-wrap items-center gap-3">
            <span className="lv-chip">{p.status}</span>
            <span className="text-sm text-[var(--lv-muted)]">
              {p.city} · <span dir="ltr">{p.address}</span>
            </span>
          </div>
          <h3 className="lv-latin mt-5 text-3xl sm:text-4xl text-[var(--lv-ink)]" dir="ltr" style={{ textAlign: 'right' }}>
            {p.name}
          </h3>
          <p className="lv-serif mt-2 text-lg text-[var(--lv-gold-dark)]">{p.tagline}</p>
          <p className="mt-4 text-[var(--lv-muted)] font-light leading-relaxed">{p.text}</p>
          <dl className="mt-6 grid sm:grid-cols-2 gap-px bg-[var(--lv-line)] border border-[var(--lv-line)]">
            {p.facts.map((f) => (
              <div key={f} className="bg-[var(--lv-cream)] px-4 py-3 text-sm text-[var(--lv-text)]">
                {f}
              </div>
            ))}
          </dl>
          {p.link && (
            <a href={p.link.href} target="_blank" rel="noopener noreferrer" className="lv-btn-dark mt-8 self-start">
              <FaCube aria-hidden="true" />
              {p.link.label}
            </a>
          )}
        </div>
      </div>
      {rest.length > 0 && (
        <div className={`grid gap-px bg-[var(--lv-line)] ${rest.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {rest.map((img) => (
            <Photo key={img.src} img={img} className={rest.length > 1 ? 'aspect-[4/3]' : 'aspect-[21/9]'} />
          ))}
        </div>
      )}
    </article>
  );
}

export default function LavanPolandPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';

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
      itemListElement: ALL_PROJECTS.map((p, i) => ({
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
    <div dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-36 md:pt-40">
        <Breadcrumbs
          items={[
            { label: 'דף הבית', href: '/' },
            { label: 'LAVAN Group', href: '/lavan-group' },
            { label: 'פולין – LAVAN PL' },
          ]}
        />
      </div>

      {/* Hero */}
      <header className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden bg-[var(--lv-ink)] min-h-[480px] sm:min-h-[560px] flex items-end">
          <Image src={`${IMG}/kato-facade-evening.webp`} alt="" aria-hidden="true" fill priority unoptimized className="object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--lv-ink)] via-[var(--lv-ink)]/65 to-transparent" />
          <div className="relative w-full px-6 sm:px-12 pb-10 sm:pb-14 pt-24 text-white">
            <p className="lv-latin text-sm text-[var(--lv-gold)]" dir="ltr" style={{ textAlign: 'right' }}>
              LAVAN PL SP. Z O.O.
            </p>
            <h1 className="lv-serif mt-3 text-4xl sm:text-6xl leading-[1.1]">
              נדל&quot;ן מניב בפולין,
              <br /> מהקרקע ועד ניהול הנכס
            </h1>
            <span className="lv-rule mt-6" aria-hidden="true" />
            <p className="mt-6 max-w-2xl text-base sm:text-lg font-light leading-relaxed text-white/85">
              LAVAN PL מאתרת, משביחה ובונה פרויקטים למגורים ולמסחר בקטוביץ, בגליביצה ובזברז&apos;ה, ומנהלת אותם
              עבור המשקיעים. חברה אחת אחראית על כל שלבי הפרויקט.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#projects" className="lv-btn">לפרויקטים</a>
              <a href="#invest" className="lv-btn-ghost">איך משקיעים</a>
            </div>
            <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 border-t border-white/20">
              {[
                { v: '4', l: 'פרויקטים' },
                { v: '94', l: 'יחידות דיור' },
                { v: '2', l: 'פרויקטים שאוכלסו' },
                { v: '3', l: 'ערים בשלזיה' },
              ].map((s) => (
                <div key={s.l} className="pt-6 pe-4">
                  <dd className="lv-serif text-3xl sm:text-4xl text-white">{s.v}</dd>
                  <dt className="mt-1 text-sm text-white/65">{s.l}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      {/* What we do */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20" aria-labelledby="what-heading">
        <SectionHead
          id="what-heading"
          kicker="WHAT WE DO"
          title="מה LAVAN PL עושה"
          lead="משקיעים בחו״ל נתקלים בדרך כלל באותן בעיות: קשה לבחור נכס מרחוק, קשה לפקח על הבנייה, וקשה לנהל שוכרים. אצלנו כל השלבים האלה נמצאים בידי אותה חברה."
        />
        <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[var(--lv-line)] border border-[var(--lv-line)]">
          {PILLARS.map((p) => (
            <li key={p.n} className="bg-white p-6">
              <span className="lv-latin text-2xl text-[var(--lv-gold)]">{p.n}</span>
              <h3 className="lv-serif mt-3 text-xl text-[var(--lv-ink)]">{p.title}</h3>
              <p className="mt-2 text-sm text-[var(--lv-muted)] font-light leading-relaxed">{p.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Projects */}
      <section id="projects" className="scroll-mt-40 bg-[var(--lv-sand)]" aria-labelledby="projects-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <SectionHead id="projects-heading" kicker="PROJECTS" title="הפרויקטים שלנו" />
          <nav aria-label="פרויקטים" className="mb-12 flex flex-wrap gap-2">
            {ALL_PROJECTS.map((p) => (
              <a key={p.id} href={`#${p.id}`} className="lv-chip hover:border-[var(--lv-gold)] transition">
                <span className="lv-latin" dir="ltr">{p.name}</span> · {p.city}
              </a>
            ))}
          </nav>

          <h3 className="lv-serif text-2xl text-[var(--lv-ink)] mb-6">בביצוע ובשיווק</h3>
          <div className="space-y-10">
            {CURRENT.map((p, i) => (
              <ProjectBlock key={p.id} p={p} flip={i % 2 === 1} />
            ))}
          </div>

          <h3 className="lv-serif text-2xl text-[var(--lv-ink)] mt-16 mb-6">פרויקטים שהושלמו</h3>
          <div className="space-y-10">
            {COMPLETED.map((p, i) => (
              <ProjectBlock key={p.id} p={p} flip={i % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Managed apartments */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20" aria-labelledby="managed-heading">
        <SectionHead
          id="managed-heading"
          kicker="MANAGED APARTMENTS"
          title="דירות להשקעה בניהול LAVAN"
          lead="אנחנו מנהלים דירות להשכרה לתקופות קצרות וארוכות: עיצוב והתאמה לשוכרים, פרסום, קבלת אורחים, ניקיון ותחזוקה, ודיווח שוטף לבעלים."
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Photo img={{ src: `${IMG}/apartment-bedroom.webp`, alt: 'חדר שינה בדירה להשקעה בניהול LAVAN בפולין', w: 900, h: 1200 }} className="aspect-[3/4]" />
          <Photo img={{ src: `${IMG}/apartment-bathroom.webp`, alt: 'חדר רחצה בדירה להשקעה בניהול LAVAN בפולין', w: 900, h: 1200 }} className="aspect-[3/4]" />
          <div className="col-span-2 lv-card p-8 flex flex-col justify-center">
            <h3 className="lv-serif text-2xl text-[var(--lv-ink)]">מה כולל הניהול</h3>
            <div className="mt-6">
              <Bullets items={MANAGEMENT} />
            </div>
          </div>
        </div>
      </section>

      {/* Why Poland */}
      <section className="bg-[var(--lv-ink)]" aria-labelledby="why-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid gap-12 lg:grid-cols-2">
          <SectionHead id="why-heading" kicker="WHY SILESIA" title="למה פולין, ולמה שלזיה" light />
          <Bullets items={WHY_POLAND} light />
        </div>
      </section>

      {/* Investor paths */}
      <section id="invest" className="scroll-mt-40 mx-auto max-w-6xl px-4 sm:px-6 py-20" aria-labelledby="invest-heading">
        <SectionHead id="invest-heading" kicker="INVEST WITH US" title="איך משקיעים עם LAVAN PL" />
        <div className="grid md:grid-cols-3 gap-px bg-[var(--lv-line)] border border-[var(--lv-line)]">
          {INVESTOR_PATHS.map((p, i) => (
            <article key={p.title} className="bg-white p-8">
              <span className="lv-latin text-4xl text-[var(--lv-gold)]">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="lv-serif mt-4 text-2xl text-[var(--lv-ink)]">{p.title}</h3>
              <p className="mt-3 text-[var(--lv-muted)] font-light leading-relaxed">{p.text}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-xs text-[var(--lv-muted)] leading-relaxed">
          ההדמיות להמחשה בלבד. המידע בעמוד זה הוא כללי, ואינו מהווה הצעה לציבור, ייעוץ השקעות או התחייבות לתשואה.
          התנאים המחייבים הם אלה שייקבעו בהסכם בכתב.
        </p>
        <Link href="/lavan-group" className="lv-link mt-6 inline-block text-sm">
          חזרה ל-LAVAN Group
        </Link>
      </section>

      <ContactBand
        title="רוצים לשמוע על הפרויקטים בפולין?"
        text="דברו איתנו ונשלח לכם את כרטיסי הדירות, המחירים והמבנה המשפטי של ההשקעה."
        waText="שלום, אשמח לפרטים על פרויקטי LAVAN PL בפולין"
      />
    </div>
  );
}
