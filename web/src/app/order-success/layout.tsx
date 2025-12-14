import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'הזמנה הושלמה',
  robots: {
    index: false,
    // Keep internal links discoverable, but don't index checkout pages
    follow: true,
  },
};

export default function OrderSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


