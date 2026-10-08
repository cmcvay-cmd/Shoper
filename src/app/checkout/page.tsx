'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NG', name: 'Nigeria', flag: '🇳' },
];

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('');
  const [countryName, setCountryName] = useState('');
  const [address, setAddress] = useState({ name: '', street: '', city: '', zip: '', phone: '' });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bankDetails, setBankDetails] = useState<any[]>([]);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const cartIds = JSON.parse(localStorage.getItem('shoper_cart') || '[]');
    if (cartIds.length === 0) { router.push('/cart'); return; }
    
    const ids = cartIds.map((i: any) => i.id);
    supabase.from('products').select('id, title, price, seller_id, stock').in('id', ids).then(({ data, error }) => {
      if (error) { setError('Failed to load cart items'); return; }
      if (data) {
        const mapped = data.map(p => {
          const ci = cartIds.find((i: any) => i.id === p.id);
          return { ...p, quantity: ci?.quantity || 1, color: ci?.color || '' };
        });
        setItems(mapped);
      }
    });

    supabase.from('bank_transfer_details').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setBankDetails(data);
    });
  }, []);

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const shipping = country ? (country === 'JP' || country === 'AE' || country === 'NG' ? 15 : 10) : 0;
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    if (!address.name || !address.street || !address.city || !address.zip || !address.phone) {
      setError('Please fill in all delivery details');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Please login to place order'); setLoading(false); return; }

      await supabase.from('profiles').upsert({ 
        id: user.id, username: user.email?.split('@')[0] || 'user', full_name: address.name, role: 'customer'
      }, { onConflict: 'id' });

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          country: countryName,
          shipping_address: address,
          payment_method: 'transfer',
          status: 'pending_transfer'
        })
        .select()
        .single();

      if (orderError || !order) {
        setError('Failed to create order: ' + (orderError?.message || 'Unknown error'));
        setLoading(false);
        return;
      }

      await supabase.from('order_items').insert(
        items.map(i => ({ order_id: order.id, product_id: i.id, quantity: i.quantity, price: i.price, color: i.color }))
      );

      localStorage.removeItem('shoper_cart');
      setSuccess(true);
      setTimeout(() => router.push('/chat'), 2500);
      
    } catch (err: any) {
      setError('Unexpected error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-40 animate-fade-up">
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'gold-gradient' : 'bg-dark-700'}`} />
        ))}
      </div>
      
      <h1 className="text-2xl font-bold gold-text mb-1">Checkout</h1>
      <p className="text-sm text-gray-400 mb-6">Step {step} of 3</p>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
      {success && <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center">✓ Order placed! Awaiting transfer verification.<br /><span className="text-xs">Redirecting to support chat...</span></div>}

      {step === 1 && (
        <div className="animate-slide-up">
          <h2 className="font-semibold text-white mb-4">Select Delivery Country</h2>
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto no-scrollbar">
            {COUNTRIES.map(c => (
              <button key={c.code} onClick={() => { setCountry(c.code); setCountryName(c.name); setStep(2); }}
                className={`glass-card p-4 text-left transition-all duration-200 hover:scale-105 active:scale-95 ${country === c.code ? 'border-gold-500 bg-gold-500/5' : ''}`}>
                <span className="text-2xl">{c.flag}</span>
                <p className="text-sm font-semibold text-white mt-2">{c.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 animate-slide-up">
          <h2 className="font-semibold text-white mb-4">Delivery Address</h2>
          <input placeholder="Full Name" value={address.name} onChange={e => setAddress({...address, name: e.target.value})} className="input-dark" />
          <input placeholder="Street Address" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="input-dark" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="City" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="input-dark" />
            <input placeholder="ZIP Code" value={address.zip} onChange={e => setAddress({...address, zip: e.target.value})} className="input-dark" />
          </div>
          <input placeholder="Phone Number" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="input-dark" />
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="btn-outline-gold flex-1">Back</button>
            <button onClick={() => setStep(3)} className="btn-gold flex-[2]">Continue</button>
          </div>
        </div>
      )}

      {step === 3 && !success && (
        <div className="space-y-4 animate-slide-up">
          <h2 className="font-semibold text-white mb-4">Bank Transfer Details</h2>
          
          {bankDetails.length > 0 ? bankDetails.map((bank, idx) => (
            <div key={idx} className="glass-card p-4 space-y-2 text-sm">
              <p className="text-gold-500 font-semibold text-lg">{bank.bank_name}</p>
              
              {/* Routing Number Row */}
              {bank.routing_number && (
                <div className="flex justify-between items-center py-2 border-b border-dark-700">
                  <span className="text-gray-400">Routing Number:</span>
                  <span className="text-white font-mono text-base">{bank.routing_number}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-b border-dark-700">
                <span className="text-gray-400">Account Number:</span>
                <span className="text-white font-mono text-base">{bank.account_number}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-dark-700">
                <span className="text-gray-400">Account Name:</span>
                <span className="text-white">{bank.account_name}</span>
              </div>
              
              {bank.swift_code && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">SWIFT Code:</span>
                  <span className="text-white font-mono">{bank.swift_code}</span>
                </div>
              )}
              
              <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-3 mt-3">
                <p className="text-xs text-gold-500 font-semibold">⚠️ Important:</p>
                <p className="text-xs text-gray-300 mt-1">Please use your Order ID as the transfer reference. Once sent, click the button below to notify us.</p>
              </div>
            </div>
          )) : (
            <div className="glass-card p-4 text-center text-gray-400">No bank details configured. Please contact support.</div>
          )}

          <div className="glass-card p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="text-white">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Shipping</span><span className="text-white">${shipping.toFixed(2)}</span></div>
            <div className="border-t border-dark-600 my-2" />
            <div className="flex justify-between text-base"><span className="font-bold text-white">Total to Transfer</span><span className="text-xl font-bold gold-text">${total.toFixed(2)}</span></div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} disabled={loading} className="btn-outline-gold flex-1">Back</button>
            <button onClick={handlePlaceOrder} disabled={loading || bankDetails.length === 0} className="btn-gold flex-[2] disabled:opacity-50">
              {loading ? 'Processing...' : 'I\'ve Made the Transfer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}