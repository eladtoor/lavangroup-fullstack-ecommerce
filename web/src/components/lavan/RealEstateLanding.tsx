import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import LeadForm from '@/components/LeadForm';
import LavanShell from './LavanShell';
import { SectionHead, Bullets, Photo, PHONE_DISPLAY, PHONE_INTL, type Img } from '@/app/lavan-group/_ui';
import { FaPhoneAlt } from 'react-icons/fa';

/*
 * Shared layout for the country real-estate landing pages (Poland, Germany).
 * Each page passes its content as data, so new facts and projects are added in the page file.
 */

export type LandingProject = { name: string; meta: string; status: string; img?: Img; href?: string };

export type RealEstateLandingContent = {
  path: string;
  country: string;
  kicker: string;
  breadcrumb: string;
  h1: string;
  intro: string;
  heroImage?: Img;
  services: { title: string; text: string }[];
  why: string[];
  whyTitle: string;
  steps: { title: string; text: string }[];
  projects?: LandingProject[];
  projectsLink?: { href: string; label: string };
  faq: { q: string; a: string }[];
  form: 'poland' | 'germany';
  formTitle: string;
  formLead: string;
};

export default function RealEstateLanding({ c }: { c: RealEstateLandingContent }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'בית', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'LAVAN Group', item: `${baseUrl}/lavan-group` },
        { '@type': 'ListItem', position: 3, name: c.breadcrumb, item: `${baseUrl}${c.path}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <LavanShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div dir="rtl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-36 md:pt-40">
          <Breadcrumbs items={[{ label: 'דף הבית', href: '/' }, { label: 'LAVAN Group', href: '/lavan-group' }, { label: c.breadcrumb }]} />
        </div>

        <header className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--lv-ink)] min-h-[440px] flex items-end">
            {c.heroImage && (
              <Image src={c.heroImage.src} alt="" aria-hidden="true" fill priority unoptimized className="object-cover opacity-45" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--lv-ink)] via-[var(--lv-ink)]/60 to-transparent" />
            <div className="relative w-full px-6 sm:px-12 pb-10 sm:pb-12 pt-24 text-white">
              <p className="lv-kicker" dir="ltr" style={{ textAlign: 'right' }}>{c.kicker}</p>
              <h1 className="lv-serif mt-3 text-4xl sm:text-5xl leading-[1.15] max-w-3xl">{c.h1}</h1>
              <p className="mt-5 max-w-2xl text-lg font-light leading-relaxed text-white/85">{c.intro}</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a href="#lead" className="lv-btn">{c.formTitle}</a>
                <a href={`tel:${PHONE_INTL}`} className="lv-btn-ghost"><FaPhoneAlt aria-hidden="true" /><span dir="ltr">{PHONE_DISPLAY}</span></a>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20" aria-labelledby="services">
          <SectionHead id="services" kicker="WHAT WE OFFER" title={`מה אנחנו עושים ב${c.country}`} />
          <div className="grid gap-px bg-[var(--lv-line)] border border-[var(--lv-line)] sm:grid-cols-2 lg:grid-cols-3">
            {c.services.map((s) => (
              <article key={s.title} className="bg-white p-7">
                <h2 className="lv-serif text-xl text-[var(--lv-ink)]">{s.title}</h2>
                <p className="mt-3 text-[var(--lv-muted)] leading-relaxed">{s.text}</p>
              </article>
            ))}
          </div>
        </section>

        {c.projects && c.projects.length > 0 && (
          <section className="bg-[var(--lv-sand)]" aria-labelledby="projects">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionHead id="projects" kicker="PROJECTS" title={`פרויקטים ב${c.country}`} />
                {c.projectsLink && <Link href={c.projectsLink.href} className="lv-link mb-10">{c.projectsLink.label}</Link>}
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {c.projects.map((p) => {
                  const inner = (
                    <>
                      {p.img ? <Photo img={p.img} className="aspect-[4/3]" /> : <div className="aspect-[4/3] bg-[var(--lv-ink)] flex items-center justify-center text-[var(--lv-gold)] lv-latin">{p.name}</div>}
                      <div className="p-5">
                        <span className="lv-chip text-xs">{p.status}</span>
                        <h3 className="lv-serif mt-3 text-lg text-[var(--lv-ink)]" dir="ltr" style={{ textAlign: 'right' }}>{p.name}</h3>
                        <p className="mt-1 text-sm text-[var(--lv-muted)]">{p.meta}</p>
                      </div>
                    </>
                  );
                  return p.href ? (
                    <Link key={p.name} href={p.href} className="lv-card block hover:shadow-lg transition">{inner}</Link>
                  ) : (
                    <article key={p.name} className="lv-card">{inner}</article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid gap-12 lg:grid-cols-2" aria-labelledby="why">
          <SectionHead id="why" kicker="WHY" title={c.whyTitle} />
          <Bullets items={c.why} />
        </section>

        <section className="bg-[var(--lv-ink)] text-white" aria-labelledby="steps">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
            <SectionHead id="steps" kicker="HOW IT WORKS" title="איך זה עובד" light />
            <ol className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {c.steps.map((s, i) => (
                <li key={s.title} className="bg-[var(--lv-ink)] p-6">
                  <span className="lv-latin text-2xl text-[var(--lv-gold)]">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="lv-serif mt-3 text-xl">{s.title}</h3>
                  <p className="mt-2 text-white/75 font-light leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="lead" className="scroll-mt-40 mx-auto max-w-6xl px-4 sm:px-6 py-20 grid gap-12 lg:grid-cols-[1fr_1.2fr] items-start" aria-labelledby="lead-h">
          <div>
            <SectionHead id="lead-h" kicker="LET'S TALK" title={c.formTitle} lead={c.formLead} />
            <p className="text-[var(--lv-muted)]">
              מעדיפים לדבר? <a href={`tel:${PHONE_INTL}`} className="lv-link" dir="ltr">{PHONE_DISPLAY}</a>
            </p>
          </div>
          <LeadForm source={c.form} variant="lavan" />
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20" aria-labelledby="faq">
          <SectionHead id="faq" kicker="FAQ" title="שאלות נפוצות" />
          <div className="divide-y divide-[var(--lv-line)] border border-[var(--lv-line)] bg-white">
            {c.faq.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="cursor-pointer list-none flex justify-between gap-4 text-lg font-medium text-[var(--lv-ink)]">
                  {f.q}<span className="text-[var(--lv-gold)] group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-[var(--lv-muted)] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-xs text-[var(--lv-muted)] leading-relaxed">
            ההדמיות להמחשה בלבד. המידע בעמוד זה הוא כללי, ואינו מהווה הצעה לציבור, ייעוץ השקעות, ייעוץ משפטי או מס, או התחייבות לתשואה.
            התנאים המחייבים הם אלה שייקבעו בהסכם בכתב.
          </p>
        </section>
      </div>
    </LavanShell>
  );
}
