import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ניהול משתמשים',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UserManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


