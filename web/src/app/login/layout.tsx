import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'התחברות',
  description: 'התחבר לחשבון שלך באתר לבן גרופ. גישה למוצרים, מבצעים והנחות בלעדיות',
  robots: {
    // Auth pages should not be indexed
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


