import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import AddToCartButton from "./AddToCartButton";
import ChatSellerButton from "./ChatSellerButton";

export default async function ProductDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: product } = await supabase.from('products').select('*, profiles(full_name)').eq('id', params.id).single();
  
  if (!product) notFound();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 rounded-2xl shadow-sm">
      <div className="relative h-96 w-full bg-gray-100 rounded-xl overflow-hidden">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.title} fill className="object-contain" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
        )}
      </div>
      <div>
        <span className="text-sm text-blue-600 font-semibold uppercase">{product.category}</span>
        <h1 className="text-3xl font-bold mt-2">{product.title}</h1>
        <p className="text-gray-600 mt-4">{product.description}</p>
        <div className="mt-6 flex items-center gap-4">
          <span className="text-3xl font-bold">${product.price}</span>
          <span className={`text-sm px-3 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">Sold by: {product.profiles?.full_name || 'Unknown'}</p>
        
        <div className="mt-8 flex gap-4">
          <AddToCartButton productId={product.id} disabled={product.stock <= 0} />
          <ChatSellerButton sellerId={product.seller_id} productId={product.id} />
        </div>
      </div>
    </div>
  );
}