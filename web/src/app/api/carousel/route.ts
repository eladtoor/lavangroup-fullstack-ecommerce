import { NextResponse } from 'next/server';

/**
 * API Route to fetch carousel images server-side
 * This eliminates the 6.5s client-side delay by fetching on the server
 * 
 * GET /api/carousel - Returns array of optimized carousel image URLs
 * 
 * Uses Firebase Admin SDK which only works in Node.js environment (API routes)
 */
export async function GET() {
  try {
    // Dynamic import to ensure firebase-admin only loads in Node.js environment
    const { getFirestore } = await import('@/lib/firebase-admin');
    const db = await getFirestore();
    const snapshot = await db.collection('carouselImages').get();
    
    const images = snapshot.docs.map((doc) => {
      const originalUrl = doc.data().url;
      // Optimize Cloudinary URLs for better performance
      const [base, rest] = originalUrl.split('/upload/');
      return `${base}/upload/q_auto,f_auto/${rest.split('/').slice(1).join('/')}`;
    });

    // Cache for 5 minutes to reduce Firestore reads
    return NextResponse.json(
      { images },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    // Log detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error fetching carousel images:', {
      message: errorMessage,
      stack: errorStack,
      envCheck: {
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
        hasCredentialsPath: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      },
    });

    // Return empty array instead of 500 error to prevent breaking the page
    // The Carousel component will show a loading skeleton
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Failed to load images',
        images: [], // Return empty array as fallback
      },
      { status: 200 } // Return 200 with empty array instead of 500
    );
  }
}

// Enable ISR (Incremental Static Regeneration) for better performance
export const revalidate = 300; // Revalidate every 5 minutes

// Ensure this route only runs on the server
export const runtime = 'nodejs';

