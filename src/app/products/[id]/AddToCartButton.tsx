'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddToCartButton({ productId, disabled }: { productId: string, disabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAdd = async () => {
    setLoading(true);
    // For simplicity, we use a local storage cart or direct order creation. 
    // In a real app, you'd have a `cart_items` table. Here we'll use localStorage for cart state to keep DB clean until checkout.
    const cart = JSON.parse(localStorage.getItem('shoper_cart') || '[]');
    const existing = cart.find((item: any) => item.id === productId);
    if (existing) existing.quantity += 1;
    else cart.push({ id: productId, quantity: 1 });
    localStorage.setItem('shoper_cart', JSON.stringify(cart));
    setLoading(false);
    router.refresh();
    alert('Added to cart!');
  };

  return (
    <button onClick={handleAdd} disabled={disabled || loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300">
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}