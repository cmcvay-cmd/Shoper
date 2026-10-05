'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-gold-400 to-amber-600 flex flex-col items-center justify-center text-white transition-opacity duration-500">
      <svg className="w-32 h-32 mb-4 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <h1 className="text-3xl font-bold tracking-wider">SHOPER</h1>
      <p className="text-sm opacity-80 mt-2">Global Shipping Worldwide</p>
    </div>
  );
}