import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'היסטוריית רכישות',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PurchaseHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


