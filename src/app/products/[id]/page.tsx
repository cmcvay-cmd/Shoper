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

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setProduct(data);
        if (data.colors?.length) setSelectedColor(data.colors[0]);
      }
    });
  }, [id]);

  if (!product) return <div className="p-10 text-center">Loading...</div>;

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('shoper_cart') || '[]');
    const existing = cart.find((i: any) => i.id === product.id && i.color === selectedColor);
    if (existing) existing.quantity += qty;
    else cart.push({ id: product.id, quantity: qty, color: selectedColor, price: product.price, title: product.title, image: product.images?.[0] });
    localStorage.setItem('shoper_cart', JSON.stringify(cart));
    alert('Added to cart!');
    router.push('/cart');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Image Gallery */}
      <div className="relative h-80 w-full bg-gray-100">
        {product.images?.[selectedImg] ? (
          <Image src={product.images[selectedImg]} alt={product.title} fill className="object-cover" />
        ) : <div className="flex items-center justify-center h-full text-gray-400">No Image</div>}
      </div>
      
      {/* Thumbnails */}
      {product.images && product.images.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
          {product.images.map((img: string, i: number) => (
            <button key={i} onClick={() => setSelectedImg(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${selectedImg === i ? 'border-amber-500' : 'border-transparent'}`}>
              <Image src={img} alt="" width={64} height={64} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}

      <div className="p-4 flex-1 overflow-y-auto pb-32">
        <h1 className="text-xl font-bold">{product.title}</h1>
        <p className="text-2xl font-bold text-amber-600 mt-2">${product.price}</p>
        <p className="text-gray-600 text-sm mt-3">{product.description}</p>

        {/* Colors */}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Color: {selectedColor}</h3>
            <div className="flex gap-2">
              {product.colors.map((c: string) => (
                <button key={c} onClick={() => setSelectedColor(c)} className={`w-8 h-8 rounded-full border-2 ${selectedColor === c ? 'border-amber-500' : 'border-gray-300'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Quantity</h3>
          <div className="flex items-center gap-4 bg-gray-100 rounded-full w-fit px-4 py-2">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-xl font-bold">-</button>
            <span className="font-semibold w-6 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="text-xl font-bold">+</button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <button onClick={addToCart} className="w-full bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-amber-600 transition">
          Add to Cart - ${(product.price * qty).toFixed(2)}
        </button>
      </div>
    </div>
  );
}