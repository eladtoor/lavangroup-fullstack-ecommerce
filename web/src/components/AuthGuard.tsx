'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Allow access to user-info, login, and register pages
      const allowedPaths = ['/user-info', '/login', '/register'];
      if (allowedPaths.includes(pathname)) {
        setIsChecking(false);
        return;
      }

      // If user is authenticated, check if profile is complete
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Check if profile is incomplete (missing required fields)
            const isProfileIncomplete =
              !userData.name ||
              !userData.phone ||
              !userData.address?.city ||
              !userData.address?.street ||
              !userData.termsAndConditions;

            if (isProfileIncomplete) {
              // Redirect to user-info to complete profile
              router.push('/user-info');
              return;
            }
          } else {
            // User document doesn't exist, redirect to complete profile
            router.push('/user-info');
            return;
          }
        } catch (error) {
          console.error('Error checking user profile:', error);
        }
      }

      setIsChecking(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Show nothing while checking (prevents flash of content)
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
