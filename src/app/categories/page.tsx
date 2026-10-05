'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function Categories() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get('cat');
    if (cat) setSelectedCat(cat);
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) {
        setProducts(data);
        const cats = data.reduce((acc: string[], p) => { if (p.category && !acc.includes(p.category)) acc.push(p.category); return acc; }, []);
        setCategories(cats);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filtered = selectedCat ? products.filter(p => p.category === selectedCat) : products;

  return (
    <div className="p-4 animate-fade-up">
      <h1 className="text-2xl font-bold gold-text mb-1">Shop</h1>
      <p className="text-sm text-gray-400 mb-5">Browse all categories</p>
      
      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-1">
        <button onClick={() => setSelectedCat(null)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedCat ? 'gold-gradient text-dark-900' : 'bg-dark-800 border border-dark-600 text-gray-300'}`}>
          All
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCat(cat)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCat === cat ? 'gold-gradient text-dark-900' : 'bg-dark-800 border border-dark-600 text-gray-300'}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-56 shimmer rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <p className="text-gray-400">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p => (
            <Link key={p.id} href={`/products/${p.id}`} className="glass-card overflow-hidden">
              <div className="relative h-36 w-full bg-dark-700">
                {p.images?.[0] ? <Image src={p.images[0]} alt={p.title} fill className="object-cover" /> : 
                  <div className="flex items-center justify-center h-full text-gold-500/30"><svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                }
              </div>
              <div className="p-3">
                <p className="text-[10px] text-gold-500 font-semibold uppercase">{p.category}</p>
                <h4 className="text-sm font-semibold text-white mt-1 line-clamp-2">{p.title}</h4>
                <p className="text-base font-bold gold-text mt-2">${p.price}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}