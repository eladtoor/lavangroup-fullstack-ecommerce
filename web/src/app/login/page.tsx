'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { setUser } from '@/lib/redux/slices/userSlice';
import { db } from '@/lib/firebase';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const refParam = searchParams.get('ref');
  const user = useAppSelector((state) => state.user?.user);

  // Removed - causes redirect loop
  // useEffect(() => {
  //   if (user?.uid) {
  //     router.push('/');
  //   }
  // }, [user, router]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const referredBy = refParam?.startsWith('agent-')
        ? refParam.replace('agent-', '')
        : null;

      if (userSnap.exists()) {
        const fullUser = userSnap.data();
        dispatch(setUser(fullUser as any));
        localStorage.setItem('user', JSON.stringify(fullUser));
        router.push('/');
      } else {
        const newUser = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || '',
          userType: 'user',
          referredBy: referredBy || null,
        };

        await setDoc(userRef, newUser);
        dispatch(setUser(newUser as any));
        localStorage.setItem('user', JSON.stringify(newUser));
        router.push('/user-info');
      }
    } catch (error: any) {
      console.error('שגיאה בהתחברות עם Google:', error.message);
      setError('אירעה שגיאה בהתחברות עם Google.');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('נא להזין אימייל וסיסמה');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const loggedInUser = userSnap.data();
        dispatch(setUser(loggedInUser as any));
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        router.push('/');
      } else {
        setError('חשבון לא נמצא, נסה להירשם.');
      }
    } catch (error: any) {
      console.error('שגיאה בהתחברות:', error.message);
      setError('אימייל או סיסמה לא תקינים.');
    }
    setLoading(false);
  };

  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">התחברות</h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <div className="space-y-4">
            <input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'מתחבר...' : 'התחברות'}
            </button>

            <p className="text-center text-gray-600">אין לך חשבון?</p>

            <button
              onClick={() => router.push(`/register${refParam ? `?ref=${refParam}` : ''}`)}
              className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition"
            >
              הרשמה
            </button>
          </div>

          <hr className="my-6 border-gray-300" />

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center bg-red-500 text-white py-2 rounded-md font-semibold hover:bg-red-600 transition"
          >
            <FontAwesomeIcon icon={faGoogle} className="text-lg mr-2" />
            התחבר עם Google
          </button>
        </div>
      </div>
  );
}
