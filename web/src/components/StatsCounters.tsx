'use client';

import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    let start = 0;
    const duration = 2500;
    const incrementTime = 50;
    const totalIncrements = duration / incrementTime;
    const increment = end / totalIncrements;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(Math.floor(start));
    }, incrementTime);

    return () => clearInterval(timer);
  }, [end]);

  return (
    <div className="group relative">
      {/* Card */}
      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 border border-white/50 overflow-hidden">
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        {/* Gradient accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${gradient}`} />
        
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse flex gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl w-40 h-36" />
          ))}
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
    <div className="relative overflow-hidden rounded-3xl">
      {/* Animated gradient background - Red, White, Green */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-200 via-white via-green-200 to-red-200 animate-gradient-shift" />
      
      {/* Floating orbs */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-red-300/40 rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-green-300/40 rounded-full blur-2xl animate-float-delayed" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-red-200/50 rounded-full blur-2xl animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/3 w-28 h-28 bg-green-200/50 rounded-full blur-2xl animate-float" />
      <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-white/60 rounded-full blur-xl animate-pulse-slow" />
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
      
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
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) scale(1.1); }
          50% { transform: translateY(20px) scale(1); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        .animate-gradient-shift {
          background-size: 300% 300%;
          animation: gradient-shift 8s ease infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
