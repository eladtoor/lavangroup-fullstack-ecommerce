import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'לוח בקרת סוכן',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AgentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


