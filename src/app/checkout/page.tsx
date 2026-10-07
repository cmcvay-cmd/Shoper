'use client';
import { useEffect, useState, useRef } from 'react';
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
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [processingPayment, setProcessingPayment] = useState(false);

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
  }, []);

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const shipping = country ? (country === 'JP' || country === 'AE' ? 15 : 10) : 0;
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    if (!address.name || !address.street || !address.city || !address.zip || !address.phone) {
      setError('Please fill in all delivery details');
      return;
    }
    if (paymentMethod === 'card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name)) {
      setError('Please fill in all card details');
      return;
    }
    
    setError('');
    setLoading(true);
    setProcessingPayment(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Please login to place order'); setLoading(false); setProcessingPayment(false); return; }

      // Ensure profile exists
      await supabase.from('profiles').upsert({ 
        id: user.id, username: user.email?.split('@')[0] || 'user', full_name: address.name, role: 'customer'
      }, { onConflict: 'id' });

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const orderStatus = paymentMethod === 'transfer' ? 'pending_transfer' : 'paid';

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          country: countryName,
          shipping_address: address,
          payment_method: paymentMethod,
          status: orderStatus
        })
        .select()
        .single();

      if (orderError || !order) {
        setError('Failed to create order: ' + (orderError?.message || 'Unknown error'));
        setLoading(false); setProcessingPayment(false);
        return;
      }

      const orderItems = items.map(i => ({
        order_id: order.id, product_id: i.id, quantity: i.quantity, price: i.price, color: i.color
      }));
      await supabase.from('order_items').insert(orderItems);

      localStorage.removeItem('shoper_cart');
      setSuccess(true);
      setTimeout(() => router.push('/chat'), 2500); // Redirect to Support Chat
      
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError('Unexpected error: ' + err.message);
    } finally {
      setLoading(false);
      setProcessingPayment(false);
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

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-shake">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center animate-fade-up">
          ✓ Order placed successfully! Redirecting to Support...
        </div>
      )}

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
            <button onClick={() => setStep(1)} className="btn-outline-gold flex-1 transition-all active:scale-95">Back</button>
            <button onClick={() => setStep(3)} className="btn-gold flex-[2] transition-all active:scale-95">Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-slide-up">
          <h2 className="font-semibold text-white mb-4">Payment & Summary</h2>
          
          {/* Payment Method Toggle */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Select Payment Method</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => setPaymentMethod('card')} className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${paymentMethod === 'card' ? 'border-gold-500 bg-gold-500/10' : 'border-dark-600'}`}>
                <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <span className="text-sm font-medium">Card</span>
              </button>
              <button onClick={() => setPaymentMethod('transfer')} className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${paymentMethod === 'transfer' ? 'border-gold-500 bg-gold-500/10' : 'border-dark-600'}`}>
                <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                <span className="text-sm font-medium">Transfer</span>
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <div className="space-y-3 animate-fade-up">
                <input placeholder="Card Number" value={cardDetails.number} onChange={e => setCardDetails({...cardDetails, number: e.target.value})} className="input-dark" maxLength={19} />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="MM/YY" value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} className="input-dark" maxLength={5} />
                  <input placeholder="CVC" value={cardDetails.cvc} onChange={e => setCardDetails({...cardDetails, cvc: e.target.value})} className="input-dark" maxLength={4} type="password" />
                </div>
                <input placeholder="Name on Card" value={cardDetails.name} onChange={e => setCardDetails({...cardDetails, name: e.target.value})} className="input-dark" />
              </div>
            ) : (
              <div className="bg-dark-700/50 rounded-xl p-4 space-y-2 text-sm animate-fade-up border border-dark-600">
                <p className="text-gold-500 font-semibold">Bank Transfer Details</p>
                <div className="flex justify-between"><span className="text-gray-400">Bank:</span><span className="text-white">Global Commerce Bank</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Account:</span><span className="text-white font-mono">8839 2019 4452</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Name:</span><span className="text-white">Shoper Marketplace LLC</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Reference:</span><span className="text-gold-500 font-mono">ORD-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span></div>
                <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-dark-600">Your order will be marked as "Pending" until the transfer is verified by our team.</p>
              </div>
            )}
          </div>
          
          <div className="glass-card p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="text-white">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Shipping</span><span className="text-white">${shipping.toFixed(2)}</span></div>
            <div className="border-t border-dark-600 my-2" />
            <div className="flex justify-between text-base"><span className="font-bold text-white">Total</span><span className="text-xl font-bold gold-text">${total.toFixed(2)}</span></div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} disabled={loading} className="btn-outline-gold flex-1 transition-all active:scale-95 disabled:opacity-50">Back</button>
            <button onClick={handlePlaceOrder} disabled={loading || processingPayment} className="btn-gold flex-[2] transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden">
              {processingPayment ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Processing...
                </span>
              ) : 'Pay & Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}