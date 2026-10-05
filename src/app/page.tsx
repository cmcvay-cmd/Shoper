import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const supabase = createClient();
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(20);
  const categories = products ? products.reduce((acc: string[], p) => { if (p.category && !acc.includes(p.category)) acc.push(p.category); return acc; }, []) : [];

  const banners = [
    { title: "Global Shipping", sub: "To 50+ Countries", bg: "from-gold-500 via-gold-600 to-gold-700", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { title: "Summer Sale", sub: "Up to 50% Off", bg: "from-amber-500 via-orange-500 to-red-500", icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" },
    { title: "New Arrivals", sub: "Fresh Styles Daily", bg: "from-emerald-500 via-teal-500 to-cyan-500", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" }
  ];

  return (
    <div className="animate-fade-up">
      {/* Hero Carousel */}
      <div className="flex overflow-x-auto snap-x no-scrollbar py-4 px-4 gap-3">
        {banners.map((b, i) => (
          <div key={i} className={`snap-center min-w-[85%] h-44 rounded-2xl bg-gradient-to-br ${b.bg} p-6 flex flex-col justify-between shadow-xl relative overflow-hidden`}>
            <div className="absolute -right-6 -bottom-6 opacity-10">
              <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d={b.icon} /></svg>
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white">{b.title}</h2>
              <p className="text-sm text-white/90 mt-1">{b.sub}</p>
            </div>
            <button className="relative z-10 self-start bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-semibold border border-white/30">
              Explore →
            </button>
          </div>
        ))}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-4 mt-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg text-white">Categories</h3>
            <Link href="/categories" className="text-xs text-gold-500 font-semibold">See all →</Link>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2">
            {categories.map(cat => (
              <Link key={cat} href={`/categories?cat=${encodeURIComponent(cat)}`} className="flex-shrink-0 px-5 py-2.5 bg-dark-800 border border-dark-600 rounded-full text-sm font-medium text-white hover:border-gold-500 transition-all">
                {cat}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products */}
      <div className="px-4 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-white">Featured Products</h3>
          <Link href="/categories" className="text-xs text-gold-500 font-semibold">View all →</Link>
        </div>
        
        {(!products || products.length === 0) ? (
          <div className="text-center py-16 glass-card">
            <svg className="w-16 h-16 mx-auto text-gold-500/40 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <p className="text-gray-400 text-sm">No products yet</p>
            <p className="text-gray-500 text-xs mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map(p => (
              <Link key={p.id} href={`/products/${p.id}`} className="glass-card overflow-hidden hover:border-gold-500/50 transition-all group">
                <div className="relative h-36 w-full bg-dark-700">
                  {p.images?.[0] ? <Image src={p.images[0]} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" /> : 
                    <div className="flex items-center justify-center h-full text-gold-500/30">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  }
                  {p.stock <= 0 && <div className="absolute top-2 left-2 bg-red-500/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">SOLD OUT</div>}
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-gold-500 font-semibold uppercase tracking-wider truncate">{p.category}</p>
                  <h4 className="text-sm font-semibold text-white mt-1 line-clamp-2 leading-tight">{p.title}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-base font-bold gold-text">${p.price}</span>
                    <span className="text-[10px] text-gray-500">{p.stock > 0 ? `${p.stock} left` : 'Out'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}