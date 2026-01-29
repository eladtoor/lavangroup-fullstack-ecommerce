'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export interface CarouselProps {
  images: string[];
}

export default function Carousel({ images }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  // Preload images for better LCP performance
  useEffect(() => {
    if (images.length === 0) return;

    // Preload first image immediately for LCP (already optimized from API)
    if (images[0]) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = images[0];
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
    }

    // Preload remaining images with lower priority (already optimized from API)
    images.slice(1).forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.setAttribute('fetchpriority', 'low');
      document.head.appendChild(link);
    });
  }, [images]);

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

  // Show loading skeleton if no images provided - same dimensions to prevent CLS
  if (!images || images.length === 0) {
    return (
      <div
        className="relative max-w-6xl mx-auto rounded-xl overflow-hidden bg-gray-200"
        style={{ aspectRatio: '3/1', maxHeight: '400px' }}
        aria-label="טוען תמונות קרוסלה"
      />
    );
  }

  return (
    <div
      className="relative max-w-6xl mx-auto rounded-xl overflow-hidden shadow-lg shadow-gray-900 bg-white/20 flex justify-center items-center hover:border-4 border-double border-gray-900"
      style={{ aspectRatio: '3/1', maxHeight: '400px' }}
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
        priority={currentIndex === 0}
        fetchPriority={currentIndex === 0 ? 'high' : 'auto'}
        loading={currentIndex === 0 ? 'eager' : 'lazy'}
        quality={currentIndex === 0 ? 85 : 75}
        style={{ willChange: currentIndex === 0 ? 'opacity' : 'auto' }}
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
