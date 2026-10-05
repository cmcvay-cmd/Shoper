'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('');
  const [countryName, setCountryName] = useState('');
  const [address, setAddress] = useState({ name: '', street: '', city: '', zip: '', phone: '' });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const cartIds = JSON.parse(localStorage.getItem('shoper_cart') || '[]');
    if (cartIds.length === 0) { router.push('/cart'); return; }
    const ids = cartIds.map((i: any) => i.id);
    supabase.from('products').select('id, title, price, seller_id').in('id', ids).then(({ data }) => {
      if (data) {
        const mapped = data.map(p => {
          const ci = cartIds.find((i: any) => i.id === p.id);
          return { ...p, quantity: ci?.quantity || 1, color: ci?.color || '' };
        });
        setItems(mapped);
      }
    });
  }, []);

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const shipping = country ? (country === 'JP' || country === 'AE' ? 15 : 10) : 0;
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); setLoading(false); return; }

    const { data: order, error } = await supabase.from('orders').insert({
      user_id: user.id, total_amount: total, country: countryName,
      shipping_address: address
    }).select().single();

    if (error || !order) { alert('Failed: ' + error?.message); setLoading(false); return; }

    const orderItems = items.map(i => ({ order_id: order.id, product_id: i.id, quantity: i.quantity, price: i.price, color: i.color }));
    await supabase.from('order_items').insert(orderItems);

    // Auto-open chat with first seller & send order card
    if (items.length > 0) {
      const firstItem = items[0];
      const { data: room } = await supabase.from('chat_rooms').upsert(
        { buyer_id: user.id, seller_id: firstItem.seller_id, product_id: firstItem.id },
        { onConflict: 'buyer_id,seller_id,product_id' }
      ).select().single();
      if (room) {
        await supabase.from('messages').insert({
          room_id: room.id, sender_id: user.id, type: 'order_card',
          metadata: { orderId: order.id, total, items: items.map(i => ({ title: i.title, qty: i.quantity, price: i.price })) }
        });
      }
    }

    localStorage.removeItem('shoper_cart');
    setLoading(false);
    router.push('/chat');
  };

  return (
    <div className="p-4 animate-fade-up">
      <div className="flex items-center gap-2 mb-6">
        {[1,2,3].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'gold-gradient' : 'bg-dark-700'}`} />
        ))}
      </div>
      <h1 className="text-2xl font-bold gold-text mb-1">Checkout</h1>
      <p className="text-sm text-gray-400 mb-6">Step {step} of 3</p>

      {step === 1 && (
        <div>
          <h2 className="font-semibold text-white mb-4">Select Delivery Country</h2>
          <div className="grid grid-cols-2 gap-3">
            {COUNTRIES.map(c => (
              <button key={c.code} onClick={() => { setCountry(c.code); setCountryName(c.name); setStep(2); }} className={`glass-card p-4 text-left transition-all ${country === c.code ? 'border-gold-500 bg-gold-500/5' : ''}`}>
                <span className="text-2xl">{c.flag}</span>
                <p className="text-sm font-semibold text-white mt-2">{c.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-white mb-4">Delivery Address</h2>
          <input placeholder="Full Name" value={address.name} onChange={e => setAddress({...address, name: e.target.value})} className="input-dark" />
          <input placeholder="Street Address" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="input-dark" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="City" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="input-dark" />
            <input placeholder="ZIP Code" value={address.zip} onChange={e => setAddress({...address, zip: e.target.value})} className="input-dark" />
          </div>
          <input placeholder="Phone Number" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="input-dark" />
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(1)} className="btn-outline-gold flex-1">Back</button>
            <button onClick={() => setStep(3)} disabled={!address.name || !address.street} className="btn-gold flex-[2] disabled:opacity-50">Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-white mb-4">Order Summary</h2>
          <div className="glass-card p-4 space-y-2">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-300 truncate flex-1">{i.title} × {i.quantity} {i.color && <span className="text-gold-500">({i.color})</span>}</span>
                <span className="text-white font-semibold">${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="glass-card p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="text-white">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Shipping to {countryName}</span><span className="text-white">${shipping.toFixed(2)}</span></div>
            <div className="border-t border-dark-600 my-2" />
            <div className="flex justify-between text-base"><span className="font-bold text-white">Total</span><span className="text-xl font-bold gold-text">${total.toFixed(2)}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-outline-gold flex-1">Back</button>
            <button onClick={handlePlaceOrder} disabled={loading} className="btn-gold flex-[2] disabled:opacity-50">{loading ? 'Processing...' : 'Place Order'}</button>
          </div>
        </div>
      )}
    </div>
  );
}