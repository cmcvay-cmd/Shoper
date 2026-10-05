'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [colors, setColors] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
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

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const files = Array.from(e.target.files);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        alert('Error uploading image: ' + uploadError.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      if (data.publicUrl) {
        uploadedUrls.push(data.publicUrl);
      }
    }

    setImageUrls(prev => [...prev, ...uploadedUrls]);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
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
      images: imageUrls, // Save array of URLs
      colors: colors ? colors.split(',').map(c => c.trim()) : []
    });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Product added successfully!');
      // Reset form
      setTitle(''); setPrice(''); setCategory(''); setStock(''); 
      setDescription(''); setImageUrls([]); setColors('');
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
        <input placeholder="Category (e.g., Electronics)" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 border rounded-xl" required />
        
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 border rounded-xl" required />
          <input placeholder="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full p-3 border rounded-xl" required />
        </div>

        <input placeholder="Colors (comma-separated: Red, Blue)" value={colors} onChange={e => setColors(e.target.value)} className="w-full p-3 border rounded-xl" />

        {/* Image Uploader */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Product Images</label>
          <input 
            type="file" 
            multiple 
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="w-full p-2 border border-dashed border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
          />
          {uploading && <p className="text-sm text-amber-600">Uploading images...</p>}
          
          {/* Image Preview Grid */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative h-24 w-full rounded-lg overflow-hidden border border-gray-200">
                  <Image src={url} alt={`Preview ${idx}`} fill className="object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition">
          Add Product
        </button>
      </form>

      <h2 className="font-bold text-lg mb-4">Existing Products ({products.length})</h2>
      <div className="space-y-3">
        {products.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
            {p.images?.[0] && (
              <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
              </div>
            )}
            <div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-gray-600">{p.category} • ${p.price} • Stock: {p.stock}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
          }
