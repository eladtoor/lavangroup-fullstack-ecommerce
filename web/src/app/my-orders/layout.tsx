import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ההזמנות שלי',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


