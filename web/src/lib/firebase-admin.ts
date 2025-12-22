/**
 * Firebase Admin SDK utility for server-side operations
 * This allows us to fetch data from Firestore on the server without client-side delays
 * 
 * IMPORTANT: This module can ONLY be used in:
 * - API Routes (app/api/.../route.ts)
 * - Server Components (but prefer API routes)
 * - Server Actions
 * 
 * DO NOT import in Client Components or it will cause build errors
 */

// Mark this module as server-only to prevent accidental client-side usage
if (typeof window !== 'undefined') {
  throw new Error('firebase-admin can only be used in server-side code');
}

let admin: any = null;
let firestore: any = null;

export async function getFirebaseAdmin() {
  if (admin) {
    return admin;
  }

  // Check for credentials first
  const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
  const hasCredentialsPath = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!hasServiceAccount && !hasCredentialsPath) {
    const error = new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS environment variable.'
    );
    console.error('Firebase Admin initialization failed:', error.message);
    console.error('For development, you can use client-side Firebase SDK instead.');
    throw error;
  }

  try {
    // Dynamic import to handle CommonJS module
    const adminModule = await import('firebase-admin');
    
    // Check if already initialized
    if (adminModule.apps.length > 0) {
      admin = adminModule;
      return admin;
    }

    // Initialize with credentials from environment
    let credential;
    
    if (hasServiceAccount) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
        credential = adminModule.credential.cert(serviceAccount);
      } catch (e) {
        const error = new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${e instanceof Error ? e.message : 'Parse error'}`);
        console.error('Firebase Admin credential error:', error);
        throw error;
      }
    } else if (hasCredentialsPath) {
      credential = adminModule.credential.applicationDefault();
    }

    adminModule.initializeApp({
      credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL || 
        'https://hybrid-app-users-default-rtdb.europe-west1.firebasedatabase.app',
    });

    admin = adminModule;
    return admin;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

export async function getFirestore() {
  if (firestore) {
    return firestore;
  }
  
  const admin = await getFirebaseAdmin();
  firestore = admin.firestore();
  return firestore;
}

