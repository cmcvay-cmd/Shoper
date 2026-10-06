'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Tab = 'dashboard' | 'products' | 'add' | 'orders' | 'users';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, users: 0 });
  
  // Product form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [colors, setColors] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, ordRes, usrRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      ]);
      if (prodRes.data) setProducts(prodRes.data);
      if (ordRes.data) setOrders(ordRes.data);
      if (usrRes.data) setUsers(usrRes.data);
      const revenue = ordRes.data?.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0) || 0;
      setStats({ revenue, orders: ordRes.data?.length || 0, products: prodRes.data?.length || 0, users: usrRes.data?.length || 0 });
    } catch (err) { console.error('Load error:', err); }
    finally { setLoading(false); }
  };

  // ROBUST MULTI-FILE UPLOAD
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    setUploadError('');
    setUploadProgress(0);
    
    const files = Array.from(e.target.files);
    const totalFiles = files.length;
    const newUrls: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setUploadError(`${file.name} is not an image`);
          continue;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setUploadError(`${file.name} is too large (max 5MB)`);
          continue;
        }
        
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
        
        // Upload to Supabase
        const { error: uploadError, data } = await supabase.storage
          .from('products')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          setUploadError(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);
        
        if (urlData.publicUrl) {
          newUrls.push(urlData.publicUrl);
        }
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
      
      // Add new URLs to existing ones
      if (newUrls.length > 0) {
        setImageUrls(prev => [...prev, ...newUrls]);
      }
      
      // Reset file input
      e.target.value = '';
      
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (idx: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Not logged in'); setFormLoading(false); return; }

    const payload = {
      seller_id: user.id,
      title, description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      colors: colors ? colors.split(',').map(c => c.trim()) : [],
      images: imageUrls,
    };

    let error;
    if (editingId) {
      const res = await supabase.from('products').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('products').insert(payload);
      error = res.error;
    }

    if (error) {
      alert('Error: ' + error.message);
      setFormLoading(false);
      return;
    }

    alert(editingId ? 'Product updated!' : 'Product added!');
    resetForm();
    await loadData();
    setActiveTab('products');
    setFormLoading(false);
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setPrice(''); setCategory('');
    setStock(''); setColors(''); setImageUrls([]); setEditingId(null);
    setUploadError('');
  };

  const editProduct = (p: any) => {
    setTitle(p.title); setDescription(p.description || '');
    setPrice(String(p.price)); setCategory(p.category);
    setStock(String(p.stock)); setColors((p.colors || []).join(', '));
    setImageUrls(p.images || []); setEditingId(p.id); setActiveTab('add');
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    await loadData();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    await loadData();
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    await loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gold-500">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-xl border-b border-dark-700 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold gold-text">Admin Panel</h1>
            <p className="text-xs text-gray-400">Manage your marketplace</p>
          </div>
          <button onClick={() => router.push('/')} className="px-3 py-1.5 bg-dark-700 rounded-lg text-xs text-gray-300">
            ← Store
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(['dashboard', 'products', 'add', 'orders', 'users'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab !== 'add') resetForm(); }}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === tab ? 'gold-gradient text-dark-900' : 'bg-dark-700 text-gray-400'
              }`}
            >
              {tab === 'add' ? (editingId ? 'Edit' : '+ Add') : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-4">
                <p className="text-xs text-gray-400 mb-1">Revenue</p>
                <p className="text-2xl font-bold gold-text">${stats.revenue.toFixed(2)}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-gray-400 mb-1">Orders</p>
                <p className="text-2xl font-bold text-white">{stats.orders}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-gray-400 mb-1">Products</p>
                <p className="text-2xl font-bold text-white">{stats.products}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-gray-400 mb-1">Users</p>
                <p className="text-2xl font-bold text-white">{stats.users}</p>
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="font-bold text-white mb-3">Recent Orders</h3>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="flex justify-between items-center py-2 border-b border-dark-700 last:border-0">
                      <div>
                        <p className="text-xs text-white">#{o.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-gray-500">{new Date(o.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-sm font-bold gold-text">${o.total_amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-white">All Products ({products.length})</h2>
              <button onClick={() => { resetForm(); setActiveTab('add'); }} className="btn-gold text-xs py-2 px-4">
                + Add New
              </button>
            </div>
            {products.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <p className="text-gray-400 mb-4">No products yet</p>
                <button onClick={() => setActiveTab('add')} className="btn-gold text-sm">Add Your First Product</button>
              </div>
            ) : (
              products.map(p => (
                <div key={p.id} className="glass-card p-3 flex gap-3">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-dark-700 flex-shrink-0">
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gold-500/30 text-2xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">{p.title}</h3>
                    <p className="text-xs text-gray-400">{p.category} • Stock: {p.stock}</p>
                    <p className="text-sm font-bold gold-text mt-1">${p.price}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => editProduct(p)} className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold">Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add/Edit Product Tab */}
        {activeTab === 'add' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-bold text-white text-lg">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-dark" placeholder="e.g., Premium Wireless Headphones" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-dark" rows={3} placeholder="Describe your product..." required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="input-dark" placeholder="e.g., Electronics, Fashion, Home" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input-dark" placeholder="29.99" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stock</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="input-dark" placeholder="100" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Colors (comma-separated)</label>
              <input type="text" value={colors} onChange={(e) => setColors(e.target.value)} className="input-dark" placeholder="Red, Blue, Black" />
            </div>

            {/* IMAGE UPLOAD SECTION */}
            <div className="glass-card p-4">
              <label className="block text-sm font-semibold text-white mb-3">
                Product Images ({imageUrls.length} uploaded)
              </label>
              
              <div className="border-2 border-dashed border-dark-600 rounded-xl p-6 text-center hover:border-gold-500 transition-all">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="text-gold-500 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">
                    {uploading ? 'Uploading...' : 'Click to upload images'}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB each • Multiple files supported
                  </p>
                </label>
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gold-500 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div className="gold-gradient h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  {uploadError}
                </div>
              )}
              
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative h-24 rounded-lg overflow-hidden border border-dark-600 group">
                      <Image src={url} alt="" fill className="object-cover" />
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 bg-gold-500 text-dark-900 text-[10px] font-bold px-2 py-0.5 rounded">
                          MAIN
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {editingId && (
                <button type="button" onClick={() => { resetForm(); setActiveTab('products'); }} className="btn-outline-gold flex-1">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={formLoading} className="btn-gold flex-1 disabled:opacity-50">
                {formLoading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            <h2 className="font-bold text-white mb-3">All Orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <div className="glass-card p-10 text-center"><p className="text-gray-400">No orders yet</p></div>
            ) : (
              orders.map(o => (
                <div key={o.id} className="glass-card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gray-500">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                    <span className="text-lg font-bold gold-text">${o.total_amount}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3"> {o.country} • {(o.shipping_address as any)?.name || 'No address'}</p>
                  <div className="flex gap-1 flex-wrap">
                    {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
                      <button key={s} onClick={() => updateOrderStatus(o.id, s)} className={`px-2 py-1 rounded text-[10px] font-semibold capitalize ${o.status === s ? 'gold-gradient text-dark-900' : 'bg-dark-700 text-gray-400'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <h2 className="font-bold text-white mb-3">All Users ({users.length})</h2>
            {users.map(u => (
              <div key={u.id} className="glass-card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-dark-900 font-bold text-sm flex-shrink-0">
                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.full_name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email || 'No email'}</p>
                </div>
                <button onClick={() => toggleUserRole(u.id, u.role || 'customer')} className={`px-3 py-1 rounded-lg text-[10px] font-semibold capitalize ${u.role === 'admin' ? 'bg-gold-500/20 border border-gold-500/30 text-gold-500' : 'bg-dark-700 text-gray-400 border border-dark-600'}`}>
                  {u.role || 'customer'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}