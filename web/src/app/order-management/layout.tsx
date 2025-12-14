import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ניהול הזמנות',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


