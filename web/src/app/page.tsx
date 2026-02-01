import HomePage from '@/components/pages/HomePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'דף הבית',
  description: 'לבן גרופ – חומרי בניין ושיפוצים במחירי סיטונאי לקבלנים, חברות בנייה ובונים פרטיים. אספקה חינם לאתר הבניה בפריסה ארצית. טמבור, קלסימו איקס, פוליסיד, דבקים, איטום, גבס ועוד.',
  keywords: ['חומרי בניין', 'טמבור', 'גבס', 'שיפוצים', 'דבקים', 'צבעים', 'לבן גרופ', 'קבלנים', 'סיטונאי', 'מחירי קבלן', 'חומרי בניין במחירי קבלן', 'הזמנה סיטונאית חומרי בניין', 'ספק חומרי בניין לקבלנים', 'אספקה לאתרי בניה', 'ליווי טכני', 'מוצרי איטום', 'דבק קרמיקה', 'טיח', 'שפכטל', 'לוחות גבס', 'חומרי גמר', 'קלסימו איקס', 'פוליסיד', 'סופרקריל', 'הנחות כמות לקבלנים', 'חומרי בניין הרצליה', 'חומרי בניין תל אביב', 'חומרי בניין ירושלים', 'משלוח חומרי בניין', 'חומרי בניין חיפה', 'חומרי בניין באר שבע'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lavangroup - חומרי בניין ושיפוצים',
    description: 'לבן גרופ – חומרי בניין במחירי סיטונאי לקבלנים וחברות בנייה. אספקה חינם לאתר הבניה בפריסה ארצית.',
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
            alternateName: 'לבן גרופ',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il',
            logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lavangroup.co.il'}/logo.png`,
            description: 'ספק חומרי בניין לקבלנים, חברות בנייה ובונים פרטיים. מחירי סיטונאי, אספקה ארצית וליווי טכני מקצועי.',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'הרצליה',
              addressRegion: 'מחוז תל אביב',
              addressCountry: 'IL',
            },
            areaServed: {
              '@type': 'Country',
              name: 'Israel',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+972-50-534-2813',
              contactType: 'customer service',
              availableLanguage: ['Hebrew'],
              email: 'Lavan1414@gmail.com',
            },
            sameAs: [
              'https://www.facebook.com',
              'https://www.instagram.com',
            ],
          }),
        }}
      />
      <HomePage />
    </>
  );
}
