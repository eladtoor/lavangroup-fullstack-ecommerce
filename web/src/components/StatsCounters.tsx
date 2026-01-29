'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Smile, Truck, Users, Clock } from 'lucide-react';

interface CounterProps {
  end: number;
  label: string;
  Icon: React.ElementType;
  gradient: string;
  iconColor: string;
}

const Counter: React.FC<CounterProps> = ({ end, label, Icon, gradient, iconColor }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);

  // Only animate when visible (Intersection Observer)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Optimized counter animation using requestAnimationFrame
  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500; // Reduced from 2500ms
    const startTime = performance.now();
    let animationId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out curve for smoother animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [end, isVisible]);

  return (
    <div className="group relative" ref={counterRef}>
      {/* Card - removed backdrop-blur on mobile for better performance */}
      <div className="relative bg-white/95 md:backdrop-blur-sm rounded-2xl p-6 shadow-xl md:hover:shadow-2xl transition-shadow duration-300 border border-white/50 overflow-hidden">
        {/* Gradient accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${gradient}`} />

        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center mb-4 mx-auto shadow-lg`}>
          <Icon className={`w-7 h-7 ${iconColor}`} strokeWidth={2} />
        </div>

        {/* Number */}
        <div className="text-center">
          <span className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tabular-nums">
            {count.toLocaleString()}
          </span>
        </div>

        {/* Label */}
        <p className="text-sm text-gray-600 text-center mt-2 font-semibold">
          {label}
        </p>
      </div>
    </div>
  );
};

interface SiteStats {
  clients: number;
  supplyPoints: number;
  onlineUsers: number;
  lastOrderMinutes: number;
}

interface StatsCountersProps {
  children?: React.ReactNode;
}

export default function StatsCounters({ children }: StatsCountersProps) {
  const [stats, setStats] = useState<SiteStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site-stats`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching site stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Reserve space to prevent CLS - show skeleton with same dimensions as final content
  if (!stats) {
    return (
      <div className="relative overflow-hidden rounded-3xl min-h-[400px]">
        {/* Match the gradient background structure */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-200 via-white via-green-200 to-red-200" />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
        
        <div className="relative py-12 px-6 md:px-12">
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto w-full">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-2xl h-36" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statsConfig = [
    { 
      end: stats.clients, 
      label: "לקוחות מרוצים", 
      Icon: Smile,
      gradient: "bg-gradient-to-br from-amber-400 to-orange-500",
      iconColor: "text-white"
    },
    { 
      end: stats.supplyPoints, 
      label: "נקודות אספקה", 
      Icon: Truck,
      gradient: "bg-gradient-to-br from-emerald-400 to-teal-500",
      iconColor: "text-white"
    },
    { 
      end: stats.onlineUsers, 
      label: "מחוברים כרגע", 
      Icon: Users,
      gradient: "bg-gradient-to-br from-blue-400 to-indigo-500",
      iconColor: "text-white"
    },
    { 
      end: stats.lastOrderMinutes, 
      label: "דקות מההזמנה האחרונה", 
      Icon: Clock,
      gradient: "bg-gradient-to-br from-rose-400 to-pink-500",
      iconColor: "text-white"
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl min-h-[400px]">
      {/* Static gradient background - animations disabled on mobile for performance */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-200 via-white via-green-200 to-red-200 md:animate-gradient-shift md:bg-[length:300%_300%]" />

      {/* Floating orbs - only shown on desktop for performance */}
      <div className="hidden md:block">
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-300/40 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-green-300/40 rounded-full blur-2xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-red-200/50 rounded-full blur-2xl animate-pulse-slow" />
      </div>

      {/* Simplified overlay */}
      <div className="absolute inset-0 bg-white/10" />
      
      {/* Content */}
      <div className="relative py-12 px-6 md:px-12">
        {/* Welcome message */}
        {children && (
          <div className="text-center mb-10">
            <div className="inline-block bg-white/90 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-xl">
              {children}
            </div>
          </div>
        )}
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {statsConfig.map((stat, index) => (
            <Counter key={index} {...stat} />
          ))}
        </div>
      </div>
      
      {/* CSS for animations - respects prefers-reduced-motion */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(15px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 12s ease infinite;
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 9s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 5s ease-in-out infinite;
        }
        /* Disable animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-gradient-shift,
          .animate-float,
          .animate-float-delayed,
          .animate-pulse-slow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
