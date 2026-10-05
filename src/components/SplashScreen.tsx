'use client';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1800);
    const t2 = setTimeout(() => setShow(false), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'radial-gradient(circle at 50% 50%, #1f1f1f 0%, #0a0a0a 100%)' }}>
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-3xl opacity-60 gold-gradient rounded-full" />
        <svg className="relative w-28 h-28 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold gold-text tracking-wider">SHOPER</h1>
      <p className="text-sm text-gray-400 mt-2 tracking-widest">GLOBAL SHOPPING WORLDWIDE</p>
      <div className="mt-8 flex gap-1">
        <span className="w-2 h-2 rounded-full bg-gold-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-gold-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-gold-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}