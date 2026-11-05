import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import LeadForm from '@/components/LeadForm';
import LavanShell from '@/components/lavan/LavanShell';
import { SectionHead, Bullets, Photo, PHONE_DISPLAY, PHONE_INTL } from '@/app/lavan-group/_ui';
import { FaPhoneAlt } from 'react-icons/fa';

/*
 * Landing page: לבן גרופ: פיתוח וקידוח — soil testing (בדיקות קרקע) across Israel.
 * Target searches: בדיקות קרקע, קידוח בדיקת קרקע, בדיקת קרקע לפני בנייה, קידוחי ניסיון.
 * Facts on this page come from the owner: soil testing nationwide, Ministry of Defense
 * authorised, works on government tenders, phone 050-5342813. Add new facts in the constants.
 */

const PATH = '/soil-testing';
const TITLE = 'בדיקות קרקע בכל הארץ | לבן גרופ: פיתוח וקידוח';
const DESCRIPTION =
  'קידוחי קרקע באמצעות מכונות קידוח מהמתקדמות בעולם, ליזמים, קבלנים, בוני בתים וגופים ציבוריים בכל הארץ. מורשה משרד הביטחון, עבודה במכרזים ממשלתיים. השאירו פרטים להצעת מחיר.';
const IMG = '/images/lavan-group/israel';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['בדיקות קרקע', 'בדיקת קרקע', 'קידוח בדיקת קרקע', 'בדיקת קרקע לפני בנייה', 'קידוחי ניסיון', 'קידוחים לבדיקת קרקע'],
  alternates: { canonical: PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PATH,
    type: 'website',
    locale: 'he_IL',
    images: [{ url: `${IMG}/drilling-rig-side.webp`, width: 1200, height: 800, alt: 'מכונת הקידוח של לבן גרופ' }],
  },
};

const CREDENTIALS = ['מכונות קידוח מהמתקדמות בעולם', 'מורשה משרד הביטחון', 'עבודה במכרזים ממשלתיים', 'פריסה בכל חלקי הארץ'];

const AUDIENCES = [
  { title: 'יזמים ובוני בתים', text: 'בדיקת קרקע לפני תכנון היסודות של בית פרטי, וילה או בניין מגורים.' },
  { title: 'קבלנים וחברות בנייה', text: 'ביצוע בשטח לפי לוח הזמנים של הפרויקט ודרישות המתכננים.' },
  { title: 'גופים ציבוריים ומכרזים', text: 'מורשה משרד הביטחון ועובדים במכרזים ממשלתיים.' },
  { title: 'מהנדסים ויועצי קרקע', text: 'עבודה מול היועץ לפי תוכנית הבדיקות שהוא מגדיר.' },
];

const STEPS = [
  { n: '01', title: 'פנייה', text: 'משאירים פרטים על הפרויקט ומיקומו, או מתקשרים.' },
  { n: '02', title: 'תיאום', text: 'מתאמים מול היזם, הקבלן או יועץ הקרקע את היקף העבודה ואת המועד.' },
  { n: '03', title: 'ביצוע בשטח', text: 'מגיעים עם מכונת הקידוח ומבצעים את הקידוחים באתר.' },
  { n: '04', title: 'המשך התכנון', text: 'הממצאים מועברים לגורם המקצועי של הפרויקט להמשך התכנון.' },
];

const FAQ = [
  { q: 'למה צריך בדיקת קרקע לפני בנייה?', a: 'מהנדס הקונסטרוקציה ויועץ הקרקע צריכים לדעת על איזו קרקע בונים כדי לתכנן נכון את היסודות. בדיקת הקרקע נותנת להם את הנתונים לכך.' },
  { q: 'באילו אזורים אתם עובדים?', a: 'בכל חלקי הארץ.' },
  { q: 'אתם עובדים מול גופים ציבוריים?', a: 'כן. לבן גרופ: פיתוח וקידוח מורשה משרד הביטחון ועובדת במכרזים ממשלתיים.' },
  { q: 'איך מקבלים הצעת מחיר?', a: `משאירים פרטים בטופס בעמוד הזה או מתקשרים ל-${PHONE_DISPLAY}, ונחזור אליכם עם הצעה לפי היקף הפרויקט.` },
];

export default function SoilTestingPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'בית', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'LAVAN Group', item: `${baseUrl}/lavan-group` },
        { '@type': 'ListItem', position: 3, name: 'בדיקות קרקע', item: `${baseUrl}${PATH}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'בדיקות קרקע',
      name: 'בדיקות קרקע – לבן גרופ: פיתוח וקידוח',
      description: DESCRIPTION,
      areaServed: { '@type': 'Country', name: 'Israel' },
      provider: {
        '@type': 'LocalBusiness',
        name: 'לבן גרופ: פיתוח וקידוח',
        telephone: PHONE_INTL,
        url: `${baseUrl}${PATH}`,
        image: `${baseUrl}${IMG}/drilling-rig-side.webp`,
        parentOrganization: { '@type': 'Organization', name: 'LAVAN Group', url: `${baseUrl}/lavan-group` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <LavanShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div dir="rtl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-36 md:pt-40">
          <Breadcrumbs items={[{ label: 'דף הבית', href: '/' }, { label: 'LAVAN Group', href: '/lavan-group' }, { label: 'בדיקות קרקע' }]} />
        </div>

        <header className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--lv-ink)] min-h-[460px] flex items-end">
            <Image src={`${IMG}/drilling-rig-side.webp`} alt="" aria-hidden="true" fill priority unoptimized className="object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--lv-ink)] via-[var(--lv-ink)]/60 to-transparent" />
            <div className="relative w-full px-6 sm:px-12 pb-10 sm:pb-12 pt-24 text-white">
              <p className="lv-kicker" dir="ltr" style={{ textAlign: 'right' }}>LAVAN GROUP · DEVELOPMENT &amp; DRILLING</p>
              <h1 className="lv-serif mt-3 text-4xl sm:text-6xl leading-[1.1]">בדיקות קרקע בכל הארץ</h1>
              <p className="mt-5 max-w-2xl text-lg font-light leading-relaxed text-white/85">
                לבן גרופ: פיתוח וקידוח מבצעת קידוחי קרקע באמצעות מכונות קידוח מהמתקדמות בעולם – ליזמים, לקבלנים, לבוני בתים ולגופים ציבוריים.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {CREDENTIALS.map((c) => (
                  <li key={c} className="rounded-full border border-white/40 px-4 py-1.5 text-sm">{c}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a href="#quote" className="lv-btn">הצעת מחיר לבדיקת קרקע</a>
                <a href={`tel:${PHONE_INTL}`} className="lv-btn-ghost"><FaPhoneAlt aria-hidden="true" /><span dir="ltr">{PHONE_DISPLAY}</span></a>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20" aria-labelledby="who">
          <SectionHead id="who" kicker="WHO WE WORK WITH" title="למי אנחנו עובדים" />
          <div className="grid gap-px bg-[var(--lv-line)] border border-[var(--lv-line)] sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <article key={a.title} className="bg-white p-6">
                <h3 className="lv-serif text-xl text-[var(--lv-ink)]">{a.title}</h3>
                <p className="mt-2 text-[var(--lv-muted)] leading-relaxed">{a.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[var(--lv-sand)]" aria-labelledby="how">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <SectionHead id="how" kicker="HOW IT WORKS" title="איך זה עובד" />
              <ol className="space-y-6">
                {STEPS.map((s) => (
                  <li key={s.n} className="flex gap-5">
                    <span className="lv-latin text-2xl text-[var(--lv-gold)] w-10 shrink-0">{s.n}</span>
                    <div>
                      <h3 className="lv-serif text-xl text-[var(--lv-ink)]">{s.title}</h3>
                      <p className="mt-1 text-[var(--lv-muted)] leading-relaxed">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <figure>
              <Photo img={{ src: `${IMG}/drilling-rig-mast.webp`, alt: 'מכונת הקידוח של לבן גרופ: פיתוח וקידוח עם תורן מורם', w: 900, h: 1351 }} className="aspect-[4/5] shadow-xl" />
              <figcaption className="mt-3 text-sm text-[var(--lv-muted)]">מכונת קידוח של הקבוצה – מהמתקדמות בעולם</figcaption>
            </figure>
          </div>
        </section>

        <section id="quote" className="scroll-mt-40 mx-auto max-w-6xl px-4 sm:px-6 py-20 grid gap-12 lg:grid-cols-[1fr_1.2fr] items-start" aria-labelledby="quote-h">
          <div>
            <SectionHead id="quote-h" kicker="GET A QUOTE" title="הצעת מחיר לבדיקת קרקע" lead="ספרו לנו על הפרויקט ומיקומו, ונחזור אליכם בהקדם עם הצעה." />
            <Bullets items={CREDENTIALS} />
            <p className="mt-8 text-[var(--lv-muted)]">
              מעדיפים לדבר? <a href={`tel:${PHONE_INTL}`} className="lv-link" dir="ltr">{PHONE_DISPLAY}</a>
            </p>
          </div>
          <LeadForm source="drilling" variant="lavan" />
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20" aria-labelledby="faq">
          <SectionHead id="faq" kicker="FAQ" title="שאלות נפוצות" />
          <div className="divide-y divide-[var(--lv-line)] border border-[var(--lv-line)] bg-white">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="cursor-pointer list-none flex justify-between gap-4 text-lg font-medium text-[var(--lv-ink)]">
                  {f.q}<span className="text-[var(--lv-gold)] group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-[var(--lv-muted)] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-sm text-[var(--lv-muted)]">
            לבן גרופ: פיתוח וקידוח היא חלק מ<Link href="/lavan-group" className="lv-link">קבוצת LAVAN</Link>, הפועלת בישראל ובמדינות נוספות.
          </p>
        </section>
      </div>
    </LavanShell>
  );
}
