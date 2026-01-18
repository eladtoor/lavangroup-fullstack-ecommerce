import HomePage from '@/components/pages/HomePage';
import { Metadata } from 'next';

// Fetch carousel images server-side for LCP optimization
async function getCarouselImages(): Promise<string[]> {
  try {
    const { getFirestore } = await import('@/lib/firebase-admin');
    const db = await getFirestore();
    const snapshot = await db.collection('carouselImages').get();

    return snapshot.docs.map((doc) => {
      const originalUrl = doc.data().url;
      // Optimize for mobile LCP (smaller size for faster loading)
      if (originalUrl.includes('cloudinary.com') && originalUrl.includes('/upload/')) {
        return originalUrl.replace(/\/upload\/([^\/]*\/)?/, '/upload/f_auto,q_auto:good,w_800,c_limit/');
      }
      return originalUrl;
    });
  } catch (error) {
    console.error('Error fetching carousel images for SSR:', error);
    return [];
  }
}

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

export default async function Home() {
  // Fetch carousel images server-side for faster LCP
  const carouselImages = await getCarouselImages();
  const firstImage = carouselImages[0] || null;

  return (
    <>
      {/* Preload LCP image for faster rendering */}
      {firstImage && (
        <link
          rel="preload"
          as="image"
          href={firstImage}
          fetchPriority="high"
        />
      )}
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
      <HomePage carouselImages={carouselImages} />
    </>
  );
}
