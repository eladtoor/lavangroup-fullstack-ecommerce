import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'עגלת קניות',
  robots: {
    index: false,
    // Keep internal links discoverable, but don't index cart pages
    follow: true,
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


