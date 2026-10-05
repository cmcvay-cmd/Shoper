import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const supabase = createClient();
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(10);
  const categories = products ? [...new Set(products.map(p => p.category))] : [];

  const banners = [
    { title: "Global Shipping", sub: "To 50+ Countries", bg: "from-amber-400 to-orange-500" },
    { title: "Summer Sale", sub: "Up to 50% Off", bg: "from-blue-400 to-indigo-500" },
    { title: "New Arrivals", sub: "Fresh Styles Daily", bg: "from-emerald-400 to-teal-500" }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Carousel */}
      <div className="flex overflow-x-auto snap-x no-scrollbar py-4 px-4 gap-3">
        {banners.map((b, i) => (
          <div key={i} className={`snap-center min-w-[85%] h-40 rounded-2xl bg-gradient-to-r ${b.bg} p-6 flex flex-col justify-center text-white shadow-lg`}>
            <h2 className="text-2xl font-bold">{b.title}</h2>
            <p className="text-sm opacity-90">{b.sub}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="px-4 mt-4">
        <h3 className="font-bold text-lg mb-3">Categories</h3>
        <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2">
          {categories.map(cat => (
            <Link key={cat} href={`/categories?cat=${cat}`} className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium whitespace-nowrap">
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="px-4 mt-6">
        <h3 className="font-bold text-lg mb-3">Featured</h3>
        <div className="grid grid-cols-2 gap-3">
          {products?.map(p => (
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
      </div>
    </div>
  );
}