import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'הרשמה',
  description: 'צור חשבון חדש באתר לבן גרופ. הצטרף אלינו ותהנה ממבצעים והנחות בלעדיות',
  robots: {
    // Auth pages should not be indexed
    index: false,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


