'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type CartItem = { id: string, quantity: number, title: string, price: number, image_url: string };

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchCart = async () => {
      const cartIds = JSON.parse(localStorage.getItem('shoper_cart') || '[]');
      if (cartIds.length === 0) return;
      
      const ids = cartIds.map((i: any) => i.id);
      const { data } = await supabase.from('products').select('id, title, price, image_url').in('id', ids);
      
      if (data) {
        const mapped = data.map(p => ({
          ...p,
          quantity: cartIds.find((i: any) => i.id === p.id)?.quantity || 1
        }));
        setItems(mapped);
      }
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

  const handleCheckout = async () => {
    if (!address.trim()) return alert('Please enter shipping address');
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ user_id: user.id, total_amount: total, shipping_address: { full: address } })
      .select()
      .single();

    if (orderError || !order) { setLoading(false); return alert('Checkout failed'); }

    const orderItems = items.map(i => ({ order_id: order.id, product_id: i.id, quantity: i.quantity, price: i.price }));
    await supabase.from('order_items').insert(orderItems);

    // Decrement stock
    for (const i of items) {
      await supabase.rpc('decrement_stock', { p_id: i.id, p_qty: i.quantity });
    }

    localStorage.removeItem('shoper_cart');
    setLoading(false);
    alert(`Order placed! ID: ${order.id}. Total: $${total}`);
    router.push('/');
  };

  const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      {items.length === 0 ? <p className="text-gray-500">Your cart is empty.</p> : (
        <>
          <div className="space-y-4 mb-8">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                <div className="w-16 h-16 bg-gray-100 rounded relative">
                  {item.image_url && <img src={item.image_url} className="object-cover w-full h-full rounded" alt="" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-gray-600">${item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded bg-gray-200">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded bg-gray-200">+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-6">
            <textarea placeholder="Shipping Address" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 border rounded-lg mb-4" rows={3} />
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold">Total: ${total.toFixed(2)}</span>
              <button onClick={handleCheckout} disabled={loading} className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400">
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}