'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Carousel() {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'carouselImages'));
        const urls = snapshot.docs.map((doc) => {
          const originalUrl = doc.data().url;
          const [base, rest] = originalUrl.split('/upload/');
          return `${base}/upload/q_auto,f_auto/${rest.split('/').slice(1).join('/')}`;
        });
        setImages(urls);
      } catch (error) {
        console.error('שגיאה בטעינת תמונות הקרוסלה:', error);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      startAutoSlide();
    }
    return stopAutoSlide;
  }, [images]);

  const startAutoSlide = () => {
    stopAutoSlide();
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
  };

  const stopAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
  };

  if (!images.length) return null;

  return (
    <div
      className="relative max-w-6xl mx-auto h-[200px] md:h-[400px] rounded-xl overflow-hidden shadow-lg shadow-gray-900 bg-white/20 flex justify-center items-center hover:border-4 border-double border-gray-900"
      onMouseEnter={stopAutoSlide}
      onMouseLeave={startAutoSlide}
    >
      <Image
        src={images[currentIndex]}
        alt={`לבן גרופ - מבצעים וחידושים בחומרי בניין - תמונה ${currentIndex + 1} מתוך ${images.length}`}
        title="מבצעים שוטפים בלבן גרופ"
        fill
        className="object-contain transition-opacity duration-700 ease-in-out"
        sizes="(max-width: 768px) 100vw, 1200px"
        priority
      />

      <button
        onClick={() => {
          stopAutoSlide();
          setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
          startAutoSlide();
        }}
        className="absolute top-1/2 left-2 md:left-4 bg-black/50 text-white p-1.5 md:p-2 rounded-full hover:bg-black/80 hover:scale-110 transition"
        aria-label="Previous slide"
      >
        <FaChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <button
        onClick={() => {
          stopAutoSlide();
          setCurrentIndex((prev) => (prev + 1) % images.length);
          startAutoSlide();
        }}
        className="absolute top-1/2 right-2 md:right-4 bg-black/50 text-white p-1.5 md:p-2 rounded-full hover:bg-black/80 hover:scale-110 transition"
        aria-label="Next slide"
      >
        <FaChevronRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <div className="flex justify-center gap-1.5 md:gap-2 absolute bottom-2 left-1/2 transform -translate-x-1/2">
        {images.map((_, index) => (
          <span
            key={index}
            onClick={() => {
              stopAutoSlide();
              setCurrentIndex(index);
              startAutoSlide();
            }}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full border border-white cursor-pointer transition ${
              index === currentIndex ? 'bg-primary' : 'bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
