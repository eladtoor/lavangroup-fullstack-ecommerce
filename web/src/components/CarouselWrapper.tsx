/**
 * Client Component wrapper for Carousel
 * Fetches carousel images from API route (server-side) to eliminate client-side delay
 */
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Carousel to reduce initial bundle size
const Carousel = dynamic(() => import('./Carousel'), {
  ssr: true, // Important for LCP
  loading: () => (
    <div
      className="relative max-w-6xl mx-auto h-[200px] md:h-[400px] rounded-xl overflow-hidden bg-gray-200 animate-pulse"
      aria-label="טוען תמונות קרוסלה"
    />
  ),
});

export default function CarouselWrapper() {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch from API route (which uses Firebase Admin server-side)
    fetch('/api/carousel')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          setImages(data.images);
        } else {
          // If API returns empty array, fallback to client-side Firebase
          console.warn('API returned empty images, falling back to client-side Firebase');
          fetchFromClientFirebase();
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching carousel images from API:', error);
        // Fallback to client-side Firebase if API fails
        fetchFromClientFirebase();
      });
  }, []);

  const fetchFromClientFirebase = async () => {
    try {
      // Fallback: Use client-side Firebase SDK
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const snapshot = await getDocs(collection(db, 'carouselImages'));
      const urls = snapshot.docs.map((doc) => {
        const originalUrl = doc.data().url;
        const [base, rest] = originalUrl.split('/upload/');
        return `${base}/upload/q_auto,f_auto/${rest.split('/').slice(1).join('/')}`;
      });
      
      if (urls.length > 0) {
        setImages(urls);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching carousel images from client Firebase:', error);
      setIsLoading(false);
    }
  };

  // Show loading skeleton while fetching
  if (isLoading) {
    return (
      <div
        className="relative max-w-6xl mx-auto h-[200px] md:h-[400px] rounded-xl overflow-hidden bg-gray-200 animate-pulse"
        aria-label="טוען תמונות קרוסלה"
      />
    );
  }

  return <Carousel images={images} />;
}

