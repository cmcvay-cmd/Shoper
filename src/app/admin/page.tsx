'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [colors, setColors] = useState('');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (!data?.is_admin) { 
        alert('Admin access required'); 
        router.push('/'); 
        return; 
      }
      setIsAdmin(true);
      fetchProducts();
    };
    checkAdmin();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('products').insert({
      seller_id: user.id,
      title,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      description,
      images: imageUrl ? [imageUrl] : [],
      colors: colors ? colors.split(',').map(c => c.trim()) : []
    });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Product added!');
      setTitle(''); setPrice(''); setCategory(''); setStock(''); setDescription(''); setImageUrl(''); setColors('');
      fetchProducts();
    }
  };

  if (!isAdmin) return <div className="p-10 text-center">Checking permissions...</div>;

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
      <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-2xl shadow-lg mb-8 space-y-4">
        <h2 className="font-bold text-lg">Add New Product</h2>
        <input placeholder="Product Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border rounded-xl" required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 border rounded-xl" rows={3} required />
        <input placeholder="Category (e.g., Electronics, Fashion)" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 border rounded-xl" required />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 border rounded-xl" required />
          <input placeholder="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full p-3 border rounded-xl" required />
        </div>
        <input placeholder="Image URL (optional)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full p-3 border rounded-xl" />
        <input placeholder="Colors (comma-separated, e.g., Red, Blue, Black)" value={colors} onChange={e => setColors(e.target.value)} className="w-full p-3 border rounded-xl" />
        <button type="submit" className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600">
          Add Product
        </button>
      </form>

      <h2 className="font-bold text-lg mb-4">Existing Products ({products.length})</h2>
      <div className="space-y-3">
        {products.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-sm text-gray-600">{p.category} • ${p.price} • Stock: {p.stock}</p>
          </div>
        ))}
      </div>
    </div>
  );
}