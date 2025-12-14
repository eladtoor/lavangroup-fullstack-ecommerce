'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAppDispatch } from '@/lib/redux/hooks';
import { setUser } from '@/lib/redux/slices/userSlice';
import { db } from '@/lib/firebase';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      setError('נא להזין אימייל וסיסמה');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Parse ref parameter
      const refParam = searchParams.get('ref');
      const referredBy = refParam?.startsWith('agent-')
        ? refParam.replace(/^agent-/, '').split('-')[0]
        : null;

      const newUser = {
        uid: user.uid,
        email: user.email,
        name: '',
        phone: '',
        isAdmin: false,
        userType: 'user',
        referredBy: referredBy || null,
      };

      await setDoc(doc(db, 'users', user.uid), newUser);
      dispatch(setUser(newUser));
      localStorage.setItem('user', JSON.stringify(newUser));

      router.push('/user-info');
    } catch (error: any) {
      console.error('שגיאה בהרשמה:', error.code, error.message);

      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('האימייל כבר רשום במערכת.');
          break;
        case 'auth/weak-password':
          setError('הסיסמה חלשה מדי. יש להשתמש בלפחות 6 תווים.');
          break;
        case 'auth/invalid-email':
          setError('האימייל שהוזן אינו תקין.');
          break;
        case 'auth/operation-not-allowed':
          setError('הרשמה באמצעות אימייל וסיסמה אינה מופעלת ב-Firebase.');
          break;
        case 'auth/network-request-failed':
          setError('בעיה בחיבור לרשת. בדוק את החיבור ונסה שוב.');
          break;
        default:
          setError(`שגיאה: ${error.message}`);
      }
    }
    setLoading(false);
  };

  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">הרשמה</h1>

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
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'נרשם...' : 'הרשמה'}
            </button>

            <p className="text-center text-gray-600 mt-4">יש לך כבר חשבון?</p>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
            >
              התחברות
            </button>
          </div>
        </div>
      </div>
  );
}
