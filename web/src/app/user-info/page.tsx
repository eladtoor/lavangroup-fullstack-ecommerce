'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, deleteUser, signOut } from 'firebase/auth';
import { useAppDispatch } from '@/lib/redux/hooks';
import { setUser, logoutUser } from '@/lib/redux/slices/userSlice';
import { db } from '@/lib/firebase';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function UserInfoPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [floor, setFloor] = useState('');
  const [entrance, setEntrance] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const formCompletedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Load existing user data from Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setIsExistingUser(true); // Mark as existing user
            setName(userData.name || '');
            setPhone(userData.phone || '');
            setCity(userData.address?.city || '');
            setStreet(userData.address?.street || '');
            setApartment(userData.address?.apartment || '');
            setFloor(userData.address?.floor || '');
            setEntrance(userData.address?.entrance || '');
            setAgreeToTerms(userData.termsAndConditions || false);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // REMOVED: Cleanup was causing issues - users getting deleted while filling form
  // Users can manually click cancel if they want to abort registration

  const handleCancelRegistration = async () => {
    if (currentUser && !isSubmitting) {
      try {
        // Delete Firestore document if exists
        const userRef = doc(db, 'users', currentUser.uid);
        await deleteDoc(userRef).catch(() => {}); // Ignore if doesn't exist

        // Delete Firebase Auth account
        await deleteUser(currentUser).catch(() => {});

        // Clear Redux and localStorage
        dispatch(logoutUser());
        localStorage.removeItem('user');
      } catch (error) {
        console.error('Error canceling registration:', error);
      }
    }
  };

  const handleCancel = async () => {
    if (!isExistingUser) {
      // Only delete account for new users
      await handleCancelRegistration();
    }
    router.push('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!agreeToTerms) {
      setError('יש לאשר את תנאי השימוש לפני ההמשך.');
      setIsSubmitting(false);
      return;
    }

    const user = auth.currentUser;
    
    if (!user) {
      setError('שגיאה: המשתמש לא מחובר. נסה שוב.');
      setIsSubmitting(false);
      return;
    }

    try {
      const updatedUser = {
        uid: user.uid,
        email: user.email,
        name: name || '',
        phone: phone || '',
        address: {
          city: city,
          street: street,
          apartment: apartment,
          floor: floor,
          entrance: entrance
        },
        userType: 'רגיל',
        termsAndConditions: true
      };

      // Save user to Redux
      dispatch(setUser(updatedUser));
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Save user to Firestore
      const userRef = doc(db, 'users', updatedUser.uid);
      await setDoc(userRef, updatedUser, { merge: true });

      // Mark form as completed to prevent cleanup
      formCompletedRef.current = true;

      router.push('/');
    } catch (error) {
      console.error('Error saving user info: ', error);
      setError('שגיאה בלתי צפויה, נסה שוב.');
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: 'דף הבית', href: '/' },
    { label: 'הרשמה', href: '/register' },
    { label: 'השלמת פרטים' }
  ];

  // If not authenticated, show login prompt
  if (!currentUser && !auth.currentUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 text-center py-20">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-6">לא מחובר</h1>
          <p className="mb-4">נראה שהתנתקת. אנא התחבר שוב.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            חזור להתחברות
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 text-center py-20">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-2xl font-bold text-gray-800 mb-6">אנא הזן את פרטיך</h1>
          {auth.currentUser && (
            <div className="mb-4 text-sm text-green-600">
              ✅ מחובר כ: {auth.currentUser.email}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-gray-700 text-right">שם:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border p-2 rounded-md"
            />
          </div>
            <div className="flex flex-col">
              <label className="text-gray-700 text-right">מספר פלאפון:</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="border p-2 rounded-md"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-700 text-right">עיר:</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="border p-2 rounded-md"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-700 text-right">רחוב:</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                className="border p-2 rounded-md"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-gray-700 text-right block">דירה:</label>
                <input
                  type="text"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  className="border p-2 rounded-md w-full"
                />
              </div>
              <div className="flex-1">
                <label className="text-gray-700 text-right block">קומה:</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="border p-2 rounded-md w-full"
                />
              </div>
              <div className="flex-1">
                <label className="text-gray-700 text-right block">כניסה:</label>
                <input
                  type="text"
                  value={entrance}
                  onChange={(e) => setEntrance(e.target.value)}
                  className="border p-2 rounded-md w-full"
                />
              </div>
            </div>

            {/* Checkbox for terms agreement */}
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-5 h-5"
              />
              <label className="text-gray-700 mb-1">
                אני מסכים ל
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  תנאים והגבלות
                </a>
              </label>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white py-2 rounded-md w-full hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isSubmitting ? 'שומר...' : 'המשך'}
            </button>
          </form>
        </div>
      </div>
  );
}
