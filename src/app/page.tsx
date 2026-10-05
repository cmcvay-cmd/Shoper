import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const supabase = createClient();
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  
  // Safely extract unique categories without Set spread to prevent TS downlevelIteration errors
  const categories = products
    ? products.reduce((acc: string[], current) => {
        if (current.category && !acc.includes(current.category)) {
          acc.push(current.category);
        }
        return acc;
      }, [])
    : [];

  return (
    <div>
      <section className="text-center py-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl mb-12">
        <h1 className="text-4xl font-bold mb-4">Global Shopping Made Simple</h1>
        <p className="text-xl opacity-90">Discover unique products from sellers worldwide.</p>
      </section>

      <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
        <Link href="/" className="px-4 py-2 bg-gray-200 rounded-full text-sm font-medium hover:bg-gray-300 whitespace-nowrap">All</Link>
        {categories.map(cat => (
          <Link key={cat} href={`/?category=${cat}`} className="px-4 py-2 bg-gray-200 rounded-full text-sm font-medium hover:bg-gray-300 whitespace-nowrap">
            {cat}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products?.map(product => (
          <Link key={product.id} href={`/products/${product.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100">
            <div className="relative h-48 w-full bg-gray-100">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.title} fill className="object-cover" />
                ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
              )}
            </div>
            <div className="p-4">
              <span className="text-xs text-blue-600 font-semibold uppercase">{product.category}</span>
              <h3 className="font-semibold mt-1 truncate">{product.title}</h3>
              <div className="flex justify-between items-center mt-3">
                <span className="text-lg font-bold text-gray-900">${product.price}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.stock > 0 ? 'In Stock' : 'Out'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}