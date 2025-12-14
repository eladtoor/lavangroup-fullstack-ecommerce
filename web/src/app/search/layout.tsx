import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'חיפוש מוצרים',
  description: 'חפש חומרי בניין, צבעים, גבס ועוד באתר לבן גרופ',
  robots: {
    index: false, // Search results shouldn't be indexed
    follow: true,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


