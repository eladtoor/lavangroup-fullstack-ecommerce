import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAILS = [
  'lavangroupapp@gmail.com',
  'eladtoorgeman@gmail.com',
  'eladto@ac.sce.ac.il',
];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const { getFirebaseAdmin, getFirestore } = await import('@/lib/firebase-admin');
    const admin = await getFirebaseAdmin();

    // Verify token and check admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const isAdmin =
      decodedToken.admin === true ||
      ADMIN_EMAILS.includes(decodedToken.email || '');

    if (!isAdmin) {
      // Check Firestore as last resort
      const db = await getFirestore();
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (!userDoc.exists || userDoc.data()?.isAdmin !== true) {
        return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
      }
    }

    // Set admin custom claim if not already set (for future client-side queries)
    if (decodedToken.admin !== true) {
      try {
        await admin.auth().setCustomUserClaims(decodedToken.uid, { admin: true });
      } catch (err) {
        console.error('Failed to set admin claim:', err);
      }
    }

    // Fetch all orders using Admin SDK (bypasses security rules)
    const db = await getFirestore();
    const purchasesSnapshot = await db.collectionGroup('purchases').get();

    const orders = [];
    const userCache: Record<string, { email: string; name: string }> = {};

    for (const docSnapshot of purchasesSnapshot.docs) {
      const orderData = docSnapshot.data();
      const userId = docSnapshot.ref.parent.parent?.id || '';

      // Cache user lookups
      if (userId && !userCache[userId]) {
        try {
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data()!;
            const email = userData.email || userData.Email || '';
            const name =
              userData.fullName ||
              userData.companyName ||
              userData.FullName ||
              userData.CompanyName ||
              userData.name ||
              userData.displayName ||
              (email ? email.split('@')[0] : '') ||
              'משתמש';
            userCache[userId] = { email, name };
          } else {
            userCache[userId] = { email: '', name: 'משתמש' };
          }
        } catch {
          userCache[userId] = { email: '', name: 'משתמש' };
        }
      }

      const customer = userCache[userId] || { email: '', name: 'משתמש' };

      orders.push({
        id: docSnapshot.id,
        userId,
        customerEmail: customer.email,
        customerName: customer.name,
        ...orderData,
        // Convert Firestore Timestamps to ISO strings
        date: orderData.date?.toDate?.() ? orderData.date.toDate().toISOString() : orderData.date,
      });
    }

    // Sort by date descending
    orders.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
