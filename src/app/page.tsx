import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

export default async function Home() {
  const supabase = createClient();
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(20);
  const categories = products ? products.reduce((acc: string[], p) => { if (p.category && !acc.includes(p.category)) acc.push(p.category); return acc; }, []) : [];

  return (
    <div className="pb-24 animate-fade-up">
      {/* Hero Banner */}
      <section className="relative px-4 pt-6 pb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-800 via-dark-750 to-dark-800 border border-gold-900/40 shadow-gold">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gold-500/5 rounded-full blur-2xl"></div>
          
          <div className="relative px-6 py-10 text-center">
            <p className="text-gold-400 text-xs font-medium tracking-[0.2em] uppercase mb-3">Global Shopping</p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight mb-3">
              Curated Luxury<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500">Redefined</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">
              Discover timeless pieces from sellers worldwide.
            </p>
            <Link href="/categories" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-dark-900 text-sm font-semibold shadow-gold-sm hover:shadow-gold transition-all duration-300 hover:scale-105 active:scale-95">
              Explore Collection
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      {categories.length > 0 && (
        <section className="px-4 mb-8">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <Link href="/" className="shrink-0 px-4 py-2 rounded-full bg-gold-600 text-dark-900 text-sm font-medium transition-all active:scale-95">All</Link>
            {categories.map((cat: string) => (
              <Link key={cat} href={`/categories?cat=${encodeURIComponent(cat)}`} className="shrink-0 px-4 py-2 rounded-full bg-dark-800 border border-dark-700 text-gray-300 text-sm hover:border-gold-700 transition-all duration-200 active:scale-95">
                {cat}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured / New Arrivals */}
      <section className="px-4 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-white">New Arrivals</h2>
          <Link href="/categories" className="text-gold-400 text-sm font-medium hover:text-gold-300 transition-colors">View all</Link>
        </div>

        {!products || products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-dark-700 bg-dark-850/50 py-16 px-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-dark-800 border border-gold-900/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <p className="text-gray-400 text-sm mb-1">No products yet</p>
            <p className="text-gray-600 text-xs">Add your first product from admin panel</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 6).map((product: any) => (
              <div key={product.id} className="glass-card overflow-hidden hover:border-gold-700/60 transition-all duration-300 group">
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative aspect-square bg-dark-800 overflow-hidden">
                    {product.images?.[0] ? (
                      <Image 
                        src={product.images[0]} 
                        alt={product.title} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gold-600/40">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </div>
                    )}
                    {product.stock <= 0 && (
                      <div className="absolute top-2 left-2 bg-red-500/90 text-white px-2 py-1 rounded-full text-[10px] font-bold">SOLD OUT</div>
                    )}
                  </div>
                </Link>
                
                {/* Product Info with Add to Cart Button */}
                <div className="p-3">
                  <p className="text-[10px] text-gold-400 font-medium tracking-wider uppercase mb-1">{product.category}</p>
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-display text-sm font-medium text-white group-hover:text-gold-200 transition-colors line-clamp-2 mb-2">
                      {product.title}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <p className="text-gold-500 font-semibold">${product.price}</p>
                    <AddToCartButton productId={product.id} disabled={product.stock <= 0} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Collections Grid */}
      <section className="px-4 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-white">Collections</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/categories?cat=Electronics" className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-dark-800 border border-dark-700 hover:border-gold-700/60 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent"></div>
            <div className="absolute inset-0 flex items-end p-4">
              <div>
                <p className="text-gold-400 text-[10px] font-medium tracking-wider uppercase mb-1">Featured</p>
                <h3 className="font-display text-base font-medium text-white group-hover:text-gold-200 transition-colors">Electronics</h3>
              </div>
            </div>
          </Link>

          <Link href="/categories?cat=Fashion" className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-dark-800 border border-dark-700 hover:border-gold-700/60 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent"></div>
            <div className="absolute inset-0 flex items-end p-4">
              <div>
                <p className="text-gold-400 text-[10px] font-medium tracking-wider uppercase mb-1">Trending</p>
                <h3 className="font-display text-base font-medium text-white group-hover:text-gold-200 transition-colors">Fashion</h3>
              </div>
            </div>
          </Link>

          <Link href="/categories?cat=Home" className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-dark-800 border border-dark-700 hover:border-gold-700/60 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent"></div>
            <div className="absolute inset-0 flex items-end p-4">
              <div>
                <p className="text-gold-400 text-[10px] font-medium tracking-wider uppercase mb-1">Seasonal</p>
                <h3 className="font-display text-base font-medium text-white group-hover:text-gold-200 transition-colors">Home</h3>
              </div>
            </div>
          </Link>

          <Link href="/categories" className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-dark-800 border border-dark-700 hover:border-gold-700/60 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent"></div>
            <div className="absolute inset-0 flex items-end p-4">
              <div>
                <p className="text-gold-400 text-[10px] font-medium tracking-wider uppercase mb-1">Exclusive</p>
                <h3 className="font-display text-base font-medium text-white group-hover:text-gold-200 transition-colors">All Products</h3>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}