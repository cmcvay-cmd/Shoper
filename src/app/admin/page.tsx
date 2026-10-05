'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Admin() {
  const [is_admin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (!data?.is_admin) { alert('Admin access required'); router.push('/'); return; }
      setIsAdmin(true);
      fetchProducts();
    };
    check();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('products').insert({
      seller_id: user.id, title, price: parseFloat(price), category, stock: parseInt(stock)
    });
    
    setTitle(''); setPrice(''); setCategory(''); setStock('');
    fetchProducts();
  };

  if (!is_admin) return <div className="text-center py-20">Checking permissions...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl shadow-sm mb-8 grid grid-cols-2 gap-4">
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="col-span-2 p-3 border rounded-lg" required />
        <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="p-3 border rounded-lg" required />
        <input placeholder="Price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="p-3 border rounded-lg" required />
        <input placeholder="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)} className="p-3 border rounded-lg" required />
        <button type="submit" className="col-span-2 bg-blue-600 text-white p-3 rounded-lg font-semibold">Add Product</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Title</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{p.title}</td>
                <td className="p-4">{p.category}</td>
                <td className="p-4">${p.price}</td>
                <td className="p-4">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}