'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddToCartButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdd = async () => {
    if (disabled || loading) return;
    
    setLoading(true);
    
    try {
      const cart = JSON.parse(localStorage.getItem('shoper_cart') || '[]');
      const existing = cart.find((i: any) => i.id === productId);
      
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ id: productId, quantity: 1 });
      }
      
      localStorage.setItem('shoper_cart', JSON.stringify(cart));
      setAdded(true);
      
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Add to cart error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={disabled || loading}
      className={`
        relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
        ${added 
          ? 'bg-green-500 text-white scale-110' 
          : 'bg-gold-500 text-dark-900 hover:bg-gold-400 active:scale-90'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={added ? 'Added!' : 'Add to cart'}
    >
      {added ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )}
    </button>
  );
}