import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ARTICLES } from '@/content/articles';

const PAGE_TITLE = 'מאמרים ומדריכים מקצועיים לקבלנים ולבונים';
const PAGE_DESCRIPTION =
  'מדריכים קצרים לקבלני בנייה ושיפוצים, אנשי גבס, רצפים, טייחים, צבעים, מנהלי אתרים ואנשי רכש: דבקים, גבס, איטום, טיח, צבע ורכש חומרי בניין.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/articles' },
  robots: { index: true, follow: true },
  openGraph: { title: PAGE_TITLE, description: PAGE_DESCRIPTION, url: '/articles', type: 'website', locale: 'he_IL' },
};

export default function ArticlesIndex() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il';
  const articles = [...ARTICLES].sort((a, b) => b.datePublished.localeCompare(a.datePublished));

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'בית', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'מאמרים', item: `${baseUrl}/articles` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: articles.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${baseUrl}/articles/${a.slug}`,
        name: a.title,
      })),
    },
  ];

  return (
    <div className="min-h-screen pt-36 md:pt-40 pb-12 max-w-6xl mx-auto px-4 sm:px-6" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ label: 'דף הבית', href: '/' }, { label: 'מאמרים' }]} />

      <header className="mt-2 mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{PAGE_TITLE}</h1>
        <p className="mt-3 max-w-3xl text-gray-600 text-base sm:text-lg leading-relaxed">
          מדריכים קצרים ומעשיים מהשטח: איך בוחרים את החומר הנכון, איך עובדים נכון, ואיך מזמינים לאתר בלי עיכובים.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <article key={a.slug} className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <p className="text-sm font-semibold text-primary">{a.category}</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 leading-snug">
              <Link href={`/articles/${a.slug}`} className="hover:text-primary transition-colors">
                {a.title}
              </Link>
            </h2>
            <p className="mt-3 flex-1 text-gray-600 leading-relaxed">{a.description}</p>
            <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
              <span>{a.audience}</span>
              <span>{a.readMinutes} דק׳ קריאה</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
