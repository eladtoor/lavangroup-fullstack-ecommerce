import HomePage from '@/components/pages/HomePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'דף הבית',
  description: 'חומרי בניין ושיפוצים באיכות הגבוהה ביותר. מבצעים מיוחדים, משלוחים מהירים לכל הארץ. טמבור, גבס, דבקים ועוד',
  keywords: ['חומרי בניין', 'טמבור', 'גבס', 'שיפוצים', 'דבקים', 'צבעים', 'לבן גרופ'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lavangroup - חומרי בניין ושיפוצים',
    description: 'חומרי בניין ושיפוצים באיכות הגבוהה ביותר. מבצעים מיוחדים ומשלוחים מהירים',
    url: '/',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Lavangroup Logo',
      },
    ],
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Lavangroup',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il'}/search?query={search_term_string}`,
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Lavangroup',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il',
            logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il'}/logo.png`,
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              availableLanguage: ['Hebrew'],
            },
            sameAs: [],
          }),
        }}
      />
      <HomePage />
    </>
  );
}
