import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAILS = [
  'lavangroupapp@gmail.com',
  'eladtoorgeman@gmail.com',
  'eladto@ac.sce.ac.il',
];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const { getFirebaseAdmin, getFirestore } = await import('@/lib/firebase-admin');
    const admin = await getFirebaseAdmin();

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Already has admin claim
    if (decodedToken.admin === true) {
      return NextResponse.json({ admin: true, alreadySet: true });
    }

    // Check email list
    if (ADMIN_EMAILS.includes(decodedToken.email || '')) {
      await admin.auth().setCustomUserClaims(decodedToken.uid, { admin: true });
      return NextResponse.json({ admin: true, alreadySet: false });
    }

    // Check Firestore isAdmin field
    const db = await getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (userDoc.exists && userDoc.data()?.isAdmin === true) {
      await admin.auth().setCustomUserClaims(decodedToken.uid, { admin: true });
      return NextResponse.json({ admin: true, alreadySet: false });
    }

    return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
  } catch (error) {
    console.error('Error ensuring admin claims:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
