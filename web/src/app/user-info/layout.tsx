import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'השלמת הרשמה',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UserInfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


