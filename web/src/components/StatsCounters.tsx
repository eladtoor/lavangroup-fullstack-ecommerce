'use client';

import React, { useEffect, useState } from 'react';
import { Smile, Truck, Users, Clock } from 'lucide-react';

interface CounterProps {
  end: number;
  label: string;
  Icon: React.ElementType;
}

const Counter: React.FC<CounterProps> = ({ end, label, Icon }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 3500;
    const incrementTime = 100;
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
    <div className="relative aspect-square bg-white/20 backdrop-blur-md border border-gray-200 rounded-3xl p-4 shadow-xl hover:scale-105 transition-transform duration-500 group overflow-hidden w-full max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px]">
      <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-primary animate-border-gradient"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <Icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-primary mb-2 sm:mb-4" />
        <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-800">{count}</span>
        <span className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 mt-1 sm:mt-2">{label}</span>
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
    return <p className="text-center my-10 text-gray-600">טוען נתונים...</p>;
  }

  return (
    <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 p-16 md:gap-10 md:p-16 mx-auto max-w-7xl bg-gradient-to-r from-green-100 via-white to-red-100 rounded-3xl shadow-2xl">
      {children}
      <Counter end={stats.clients} label="לקוחות מרוצים" Icon={Smile} />
      <Counter end={stats.supplyPoints} label="נקודות אספקה" Icon={Truck} />
      <Counter end={stats.onlineUsers} label="מחוברים כרגע" Icon={Users} />
      <Counter end={stats.lastOrderMinutes} label="דקות מההזמנה האחרונה" Icon={Clock} />
    </div>
  );
}
