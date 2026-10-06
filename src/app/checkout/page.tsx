'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇧' },
  { code: 'JP', name: 'Japan', flag: '🇵' },
  { code: 'DE', name: 'Germany', flag: '🇪' },
  { code: 'AU', name: 'Australia', flag: '🇺' },
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const cartIds = JSON.parse(localStorage.getItem('shoper_cart') || '[]');
    if (cartIds.length === 0) { router.push('/cart'); return; }
    
    const ids = cartIds.map((i: any) => i.id);
    supabase.from('products').select('id, title, price, seller_id, stock').in('id', ids).then(({ data, error }) => {
      if (error) {
        setError('Failed to load cart items');
        return;
      }
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
    
    setError('');
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { 
        setError('Please login to place order');
        setLoading(false);
        return; 
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          country: countryName,
          shipping_address: address,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error('Order error:', orderError);
        setError('Failed to create order: ' + (orderError?.message || 'Unknown error'));
        setLoading(false);
        return;
      }

      // Create order items
      const orderItems = items.map(i => ({
        order_id: order.id,
        product_id: i.id,
        quantity: i.quantity,
        price: i.price,
        color: i.color
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      
      if (itemsError) {
        console.error('Order items error:', itemsError);
        // Don't fail completely - order is created
        console.warn('Order items failed but order was created');
      }

      // Auto-open chat with first seller
      if (items.length > 0) {
        const firstItem = items[0];
        
        // Create or get chat room
        const { data: room, error: roomError } = await supabase
          .from('chat_rooms')
          .upsert({
            buyer_id: user.id,
            seller_id: firstItem.seller_id,
            product_id: firstItem.id
          }, { onConflict: 'buyer_id,seller_id,product_id' })
          .select()
          .single();

        if (room && !roomError) {
          // Send order confirmation message
          await supabase.from('messages').insert({
            room_id: room.id,
            sender_id: user.id,
            type: 'order_card',
            content: 'New order placed',
            metadata: {
              orderId: order.id,
              total: total,
              items: items.map(i => ({
                title: i.title,
                qty: i.quantity,
                price: i.price
              }))
            }
          });

          // Clear cart
          localStorage.removeItem('shoper_cart');
          
          // Navigate to chat
          router.push(`/chat?room=${room.id}`);
          return;
        }
      }

      // Fallback: clear cart and go to profile
      localStorage.removeItem('shoper_cart');
      setSuccess(true);
      setTimeout(() => router.push('/profile'), 2000);
      
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError('Unexpected error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-40 animate-fade-up">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'gold-gradient' : 'bg-dark-700'}`} />
        ))}
      </div>
      
      <h1 className="text-2xl font-bold gold-text mb-1">Checkout</h1>
      <p className="text-sm text-gray-400 mb-6">Step {step} of 3</p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-shake">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center animate-fade-up">
          ✓ Order placed successfully!
        </div>
      )}

      {step === 1 && (
        <div className="animate-slide-up">
          <h2 className="font-semibold text-white mb-4">Select Delivery Country</h2>
          <div className="grid grid-cols-2 gap-3">
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                onClick={() => { setCountry(c.code); setCountryName(c.name); setStep(2); }}
                className={`glass-card p-4 text-left transition-all duration-200 hover:scale-105 active:scale-95 ${country === c.code ? 'border-gold-500 bg-gold-500/5' : ''}`}
              >
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
          <input
            placeholder="Full Name"
            value={address.name}
            onChange={e => setAddress({...address, name: e.target.value})}
            className={`input-dark transition-all ${!address.name && error ? 'border-red-500' : ''}`}
          />
          <input
            placeholder="Street Address"
            value={address.street}
            onChange={e => setAddress({...address, street: e.target.value})}
            className={`input-dark transition-all ${!address.street && error ? 'border-red-500' : ''}`}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="City"
              value={address.city}
              onChange={e => setAddress({...address, city: e.target.value})}
              className={`input-dark transition-all ${!address.city && error ? 'border-red-500' : ''}`}
            />
            <input
              placeholder="ZIP Code"
              value={address.zip}
              onChange={e => setAddress({...address, zip: e.target.value})}
              className={`input-dark transition-all ${!address.zip && error ? 'border-red-500' : ''}`}
            />
          </div>
          <input
            placeholder="Phone Number"
            value={address.phone}
            onChange={e => setAddress({...address, phone: e.target.value})}
            className={`input-dark transition-all ${!address.phone && error ? 'border-red-500' : ''}`}
          />
          
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setStep(1); setError(''); }} className="btn-outline-gold flex-1 transition-all active:scale-95">
              Back
            </button>
            <button onClick={() => { setStep(3); setError(''); }} className="btn-gold flex-[2] transition-all active:scale-95">
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-slide-up">
          <h2 className="font-semibold text-white mb-4">Order Summary</h2>
          
          <div className="glass-card p-4 space-y-3">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-300 truncate flex-1 pr-2">
                  {i.title} × {i.quantity}
                  {i.color && <span className="text-gold-500"> ({i.color})</span>}
                </span>
                <span className="text-white font-semibold">${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="glass-card p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Shipping to {countryName}</span>
              <span className="text-white">${shipping.toFixed(2)}</span>
            </div>
            <div className="border-t border-dark-600 my-2" />
            <div className="flex justify-between text-base">
              <span className="font-bold text-white">Total</span>
              <span className="text-xl font-bold gold-text">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Buyer Protection</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              disabled={loading}
              className="btn-outline-gold flex-1 transition-all active:scale-95 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="btn-gold flex-[2] transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </span>
              ) : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}