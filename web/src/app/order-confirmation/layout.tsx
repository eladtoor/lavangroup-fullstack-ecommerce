import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'אישור הזמנה',
  robots: {
    index: false,
    // Keep internal links discoverable, but don't index checkout pages
    follow: true,
  },
};

export default function OrderConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


