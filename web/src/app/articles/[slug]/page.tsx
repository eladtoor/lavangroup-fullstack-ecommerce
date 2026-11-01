import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ARTICLES, getArticle, type ArticleBlock } from '@/content/articles';

// Articles are static content: pre-render every article at build time (no server work per request).
export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = getArticle(params.slug);
  if (!a) return {};
  const path = `/articles/${a.slug}`;
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title: a.title,
      description: a.description,
      url: path,
      type: 'article',
      locale: 'he_IL',
      publishedTime: a.datePublished,
      images: [{ url: '/logo.png', alt: 'לבן גרופ' }],
    },
    twitter: { card: 'summary', title: a.title, description: a.description },
  };
}

function Block({ b }: { b: ArticleBlock }) {
  switch (b.type) {
    case 'h2':
      return <h2 className="mt-10 mb-3 text-2xl font-bold text-gray-900">{b.text}</h2>;
    case 'ul':
      return (
        <ul className="my-4 space-y-2 list-disc pr-6 text-gray-800 leading-relaxed">
          {b.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );
    case 'tip':
      return (
        <p className="my-6 rounded-lg border-r-4 border-primary bg-primary-50 px-5 py-4 text-gray-800 leading-relaxed">
          <strong>טיפ מהשטח: </strong>
          {b.text}
        </p>
      );
    default:
      return <p className="my-4 text-gray-800 text-lg leading-relaxed">{b.text}</p>;
  }
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';
  const url = `${baseUrl}/articles/${a.slug}`;
  const related = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 3);
  const waText = encodeURIComponent(`שלום, קראתי את המדריך "${a.title}" באתר ואשמח להצעת מחיר`);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'בית', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'מאמרים', item: `${baseUrl}/articles` },
        { '@type': 'ListItem', position: 3, name: a.title, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: a.description,
      datePublished: a.datePublished,
      dateModified: a.datePublished,
      inLanguage: 'he-IL',
      mainEntityOfPage: url,
      keywords: a.keywords.join(', '),
      author: { '@type': 'Organization', name: 'לבן גרופ', url: baseUrl },
      publisher: { '@type': 'Organization', name: 'לבן גרופ', logo: { '@type': 'ImageObject', url: `${baseUrl}/logo.png` } },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: a.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <div className="min-h-screen pt-36 md:pt-40 pb-12 max-w-6xl mx-auto px-4 sm:px-6" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ label: 'דף הבית', href: '/' }, { label: 'מאמרים', href: '/articles' }, { label: a.category }]} />

      <div className="mt-2 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article>
          <header>
            <p className="text-sm font-semibold text-primary">{a.category}</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{a.title}</h1>
            <p className="mt-3 text-sm text-gray-500">
              למי זה מתאים: {a.audience} · {a.readMinutes} דק׳ קריאה
            </p>
          </header>

          <div className="mt-6">
            {a.body.map((b, i) => (
              <Block key={i} b={b} />
            ))}
          </div>

          <section className="mt-12" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-2xl font-bold text-gray-900">שאלות נפוצות</h2>
            <div className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
              {a.faq.map((f) => (
                <details key={f.q} className="group p-5">
                  <summary className="cursor-pointer list-none font-semibold text-gray-900 flex justify-between gap-4">
                    {f.q}
                    <span className="text-primary group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 text-gray-700 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </article>

        {/* Sidebar: shop links + quote. Keeps readers one click away from products. */}
        <aside className="lg:sticky lg:top-40 h-fit space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">המוצרים בחנות</h2>
            <ul className="mt-4 space-y-2">
              {a.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 font-semibold text-gray-800 hover:bg-primary hover:text-white transition">
                    {l.label}
                    <span aria-hidden="true">←</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-gray-900 p-6 text-white">
            <h2 className="text-lg font-bold">קבלן? מזמינים בכמויות?</h2>
            <p className="mt-2 text-sm text-gray-300 leading-relaxed">
              שלחו כתב כמויות ונחזור עם הצעת מחיר מרוכזת ואספקה ישירה לאתר.
            </p>
            <a
              href={`https://wa.me/972505342813?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-semibold text-white hover:opacity-90 transition"
            >
              <FaWhatsapp aria-hidden="true" />
              הצעת מחיר בוואטסאפ
            </a>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-2xl font-bold text-gray-900">מדריכים נוספים</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} href={`/articles/${r.slug}`} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition">
                <p className="text-sm font-semibold text-primary">{r.category}</p>
                <p className="mt-2 font-bold text-gray-900 leading-snug">{r.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
