'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const COUNTRIES = ['Japan', 'United Kingdom', 'Germany', 'Australia', 'UAE', 'United States', 'Canada', 'France'];

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState({ name: '', street: '', city: '', zip: '', phone: '' });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const cartIds = JSON.parse(localStorage.getItem('shoper_cart') || '[]');
    if (cartIds.length === 0) return;
    // Fetch real product data for cart items (simplified for brevity, assuming cart stores full data or we fetch)
    // For this mobile flow, we assume the cart stored in localStorage has the necessary details.
    setItems(cartIds); 
  }, []);

  const total = items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
  const shipping = country === 'UAE' || country === 'Japan' ? 15 : 10;

  const handlePlaceOrder = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({ user_id: user.id, total_amount: total + shipping, country, shipping_address: address })
      .select()
      .single();

    if (error || !order) { setLoading(false); return alert('Failed to place order'); }

    const orderItems = items.map((i: any) => ({ order_id: order.id, product_id: i.id, quantity: i.quantity, price: i.price, color: i.color }));
    await supabase.from('order_items').insert(orderItems);

    // Auto-open chat & send order card
    if (items.length > 0) {
      const sellerId = '00000000-0000-0000-0000-000000000000'; // Replace with actual seller_id from product
      const { data: room } = await supabase.from('chat_rooms').upsert({ buyer_id: user.id, seller_id: sellerId, product_id: items[0].id }, { onConflict: 'buyer_id,seller_id,product_id' }).select().single();
      if (room) {
        await supabase.from('messages').insert({
          room_id: room.id, sender_id: user.id, type: 'order_card',
          metadata: { orderId: order.id, total: total + shipping, items: items }
        });
      }
    }

    localStorage.removeItem('shoper_cart');
    setLoading(false);
    router.push('/chat');
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Checkout (Step {step}/3)</h1>
      
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Select Country</h2>
          <div className="grid grid-cols-2 gap-3">
            {COUNTRIES.map(c => (
              <button key={c} onClick={() => { setCountry(c); setStep(2); }} className={`p-4 rounded-xl border-2 text-left font-medium ${country === c ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Delivery Details</h2>
          <input placeholder="Full Name" value={address.name} onChange={e => setAddress({...address, name: e.target.value})} className="w-full p-3 border rounded-xl" />
          <input placeholder="Street Address" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full p-3 border rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="City" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full p-3 border rounded-xl" />
            <input placeholder="ZIP Code" value={address.zip} onChange={e => setAddress({...address, zip: e.target.value})} className="w-full p-3 border rounded-xl" />
          </div>
          <input placeholder="Phone Number" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="w-full p-3 border rounded-xl" />
          <button onClick={() => setStep(3)} disabled={!address.name || !address.street} className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl disabled:bg-gray-300">Continue</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Order Summary</h2>
          <div className="bg-gray-50 p-4 rounded-xl space-y-2">
            {items.map((i: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{i.title} x{i.quantity} ({i.color})</span>
                <span>${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-4">
            <span>Total (inc. ${shipping} shipping)</span>
            <span className="text-amber-600">${(total + shipping).toFixed(2)}</span>
          </div>
          <button onClick={handlePlaceOrder} disabled={loading} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:bg-gray-300">
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      )}
    </div>
  );
}