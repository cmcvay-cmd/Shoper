'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Cart() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchCart = async () => {
      const cartIds = JSON.parse(localStorage.getItem('shoper_cart') || '[]');
      if (cartIds.length === 0) { setLoading(false); return; }
      const ids = cartIds.map((i: any) => i.id);
      const { data } = await supabase.from('products').select('id, title, price, images, stock, seller_id').in('id', ids);
      if (data) {
        const mapped = data.map(p => {
          const ci = cartIds.find((i: any) => i.id === p.id);
          return { ...p, quantity: ci?.quantity || 1, color: ci?.color || '' };
        });
        setItems(mapped);
      }
      setLoading(false);
    };
    fetchCart();
  }, []);

  const updateQty = (id: string, delta: number) => {
    const cart = JSON.parse(localStorage.getItem('shoper_cart') || '[]');
    const item = cart.find((i: any) => i.id === id);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) cart.splice(cart.indexOf(item), 1);
    }
    localStorage.setItem('shoper_cart', JSON.stringify(cart));
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const removeItem = (id: string) => {
    const cart = JSON.parse(localStorage.getItem('shoper_cart') || '[]').filter((i: any) => i.id !== id);
    localStorage.setItem('shoper_cart', JSON.stringify(cart));
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  if (loading) return <div className="p-6"><div className="h-32 shimmer rounded-2xl mb-3" /><div className="h-32 shimmer rounded-2xl" /></div>;

  return (
    <div className="p-4 animate-fade-up">
      <h1 className="text-2xl font-bold gold-text mb-1">Your Cart</h1>
      <p className="text-sm text-gray-400 mb-5">{items.length} {items.length === 1 ? 'item' : 'items'}</p>

      {items.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <svg className="w-20 h-20 mx-auto text-gold-500/30 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <p className="text-gray-400 mb-4">Your cart is empty</p>
          <Link href="/categories" className="btn-gold inline-block">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {items.map(item => (
              <div key={item.id} className="glass-card p-3 flex gap-3">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-dark-700 flex-shrink-0">
                  {item.images?.[0] ? <Image src={item.images[0]} alt={item.title} fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-gold-500/30">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>
                  {item.color && <p className="text-xs text-gold-500 mt-0.5">Color: {item.color}</p>}
                  <p className="text-base font-bold gold-text mt-1">${item.price}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="inline-flex items-center gap-2 bg-dark-700 rounded-lg px-2 py-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded text-gold-500 font-bold">−</button>
                      <span className="text-sm font-semibold text-white w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded text-gold-500 font-bold">+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-xs text-red-400 font-semibold">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card p-4 mb-4">
            <div className="flex justify-between text-sm mb-2"><span className="text-gray-400">Subtotal</span><span className="text-white font-semibold">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm mb-2"><span className="text-gray-400">Shipping</span><span className="text-white font-semibold">Calculated at checkout</span></div>
            <div className="border-t border-dark-600 my-3" />
            <div className="flex justify-between"><span className="font-bold text-white">Total</span><span className="text-xl font-bold gold-text">${subtotal.toFixed(2)}</span></div>
          </div>

          <button onClick={() => router.push('/checkout')} className="btn-gold w-full">Proceed to Checkout</button>
        </>
      )}
    </div>
  );
}