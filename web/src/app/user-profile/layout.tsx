import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'פרופיל משתמש',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


