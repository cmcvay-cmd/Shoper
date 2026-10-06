'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [product, setProduct] = useState<any>(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setProduct(data);
        if (data.colors?.length) setSelectedColor(data.colors[0]);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-10"><div className="h-80 shimmer rounded-2xl" /></div>;
  if (!product) return <div className="p-10 text-center text-gray-400">Product not found</div>;

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('shoper_cart') || '[]');
    const existing = cart.find((i: any) => i.id === product.id && i.color === selectedColor);
    if (existing) existing.quantity += qty;
    else cart.push({ id: product.id, quantity: qty, color: selectedColor, price: product.price, title: product.title, image: product.images?.[0], seller_id: product.seller_id });
    localStorage.setItem('shoper_cart', JSON.stringify(cart));
    router.push('/cart');
  };

  const chatSeller = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: room } = await supabase.from('chat_rooms').upsert({ buyer_id: user.id, seller_id: product.seller_id, product_id: product.id }, { onConflict: 'buyer_id,seller_id,product_id' }).select().single();
    if (room) router.push(`/chat?room=${room.id}`);
  };

  return (
    // Added pb-32 to ensure content isn't hidden by the global BottomNav
    <div className="animate-fade-up pb-32"> 
      <div className="relative h-96 w-full bg-dark-800">
        {product.images?.[selectedImg] ? <Image src={product.images[selectedImg]} alt={product.title} fill className="object-contain" /> : 
          <div className="flex items-center justify-center h-full text-gold-500/30"><svg className="w-20 h-20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
        }
      </div>

      {product.images && product.images.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
          {product.images.map((img: string, i: number) => (
            <button key={i} onClick={() => setSelectedImg(i)} className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImg === i ? 'border-gold-500' : 'border-dark-600'}`}>
              <Image src={img} alt="" width={64} height={64} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}

      <div className="p-4">
        <p className="text-xs text-gold-500 font-semibold uppercase tracking-wider">{product.category}</p>
        <h1 className="text-2xl font-bold text-white mt-2">{product.title}</h1>
        <p className="text-3xl font-bold gold-text mt-3">${product.price}</p>
        <p className="text-gray-400 text-sm mt-4 leading-relaxed">{product.description}</p>

        {product.colors && product.colors.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-white mb-3">Color: <span className="text-gold-500">{selectedColor}</span></h3>
            <div className="flex gap-3">
              {product.colors.map((c: string) => (
                <button key={c} onClick={() => setSelectedColor(c)} className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === c ? 'border-gold-500 scale-110' : 'border-dark-600'}`} style={{ backgroundColor: c.toLowerCase() }} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-white mb-3">Quantity</h3>
          <div className="inline-flex items-center gap-4 bg-dark-800 border border-dark-600 rounded-xl px-4 py-2">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-lg bg-dark-700 text-gold-500 font-bold">−</button>
            <span className="font-bold text-white w-6 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded-lg bg-dark-700 text-gold-500 font-bold">+</button>
          </div>
        </div>

        {/* Inline Action Buttons (Replaces the old fixed bottom bar) */}
        <div className="mt-8 flex gap-3">
          <button onClick={chatSeller} className="flex-1 btn-outline-gold py-3">Chat with Seller</button>
          <button onClick={addToCart} className="flex-[2] btn-gold">Add to Cart · ${(product.price * qty).toFixed(2)}</button>
        </div>
      </div>
    </div>
  );
}