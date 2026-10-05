import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const supabase = createClient();
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  
  const categories = products
    ? products.reduce((acc: string[], current) => {
        if (current.category && !acc.includes(current.category)) {
          acc.push(current.category);
        }
        return acc;
      }, [])
    : [];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-12 shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            Global Shopping<br />Made Simple
          </h1>
          <p className="text-xl opacity-90 mb-8 max-w-lg">
            Discover unique products from sellers worldwide. Secure, fast, and reliable.
          </p>
          <Link 
            href="/login" 
            className="inline-block bg-white text-purple-600 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Start Shopping
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/2" />
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          <Link 
            href="/" 
            className="px-6 py-3 bg-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg whitespace-nowrap transition-all duration-200 border-2 border-transparent hover:border-blue-500"
          >
            All Products
          </Link>
          {categories.map(cat => (
            <Link 
              key={cat} 
              href={`/?category=${cat}`} 
              className="px-6 py-3 bg-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg whitespace-nowrap transition-all duration-200 border-2 border-transparent hover:border-purple-500 capitalize"
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products?.map(product => (
            <Link 
              key={product.id} 
              href={`/products/${product.id}`} 
              className="product-card group"
            >
              <div className="relative h-64 w-full bg-gradient-to-br from-gray-100 to-gray-200">
                {product.image_url ? (
                  <Image 
                    src={product.image_url} 
                    alt={product.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-300" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {product.stock <= 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    Out of Stock
                  </div>
                )}
              </div>
              <div className="p-5">
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                  {product.category}
                </span>
                <h3 className="font-bold text-gray-800 mt-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {product.title}
                </h3>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-2xl font-bold text-gray-900">
                    ${product.price}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    product.stock > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock > 0 ? `${product.stock} left` : 'Sold Out'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {(!products || products.length === 0) && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500 text-lg">No products yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}