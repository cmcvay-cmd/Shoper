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
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get('cat');
    if (cat) setSelectedCat(cat);

    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) {
        setProducts(data);
        const cats = [...new Set(data.map(p => p.category))];
        setCategories(cats);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = selectedCat 
    ? products.filter(p => p.category === selectedCat)
    : products;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Shop by Category</h1>
      
      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6">
        <button 
          onClick={() => setSelectedCat(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${!selectedCat ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${selectedCat === cat ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>No products found. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map(p => (
            <Link key={p.id} href={`/products/${p.id}`} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
              <div className="relative h-32 w-full bg-gray-200">
                {p.images?.[0] ? <Image src={p.images[0]} alt={p.title} fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Image</div>}
              </div>
              <div className="p-3">
                <h4 className="text-sm font-semibold truncate">{p.title}</h4>
                <p className="text-amber-600 font-bold mt-1">${p.price}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}