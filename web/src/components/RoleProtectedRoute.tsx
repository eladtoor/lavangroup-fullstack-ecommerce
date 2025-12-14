'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const user = useAppSelector((state) => state.user?.user);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // User is still loading
    if (user === undefined) {
      setIsAuthorized(null);
      return;
    }

    // User is not logged in or has no role
    if (!user || (!user.userType && !user.isAdmin)) {
      router.push('/');
      return;
    }

    // Check if user has required role
    const authorized =
      allowedRoles.includes(user.userType) ||
      (allowedRoles.includes('admin') && user.isAdmin);

    if (!authorized) {
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, [user, allowedRoles, router]);

  // Show loading spinner while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  // Only render children if authorized
  return isAuthorized ? <>{children}</> : null;
}
