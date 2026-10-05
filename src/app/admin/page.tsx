'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'users' | 'add';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, users: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [colors, setColors] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data?.role !== 'admin') { alert('Admin access required'); router.push('/'); return; }
      setIsAdmin(true);
      await loadData();
    };
    checkAdmin();
  }, []);

  const loadData = async () => {
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
    setStats({
      revenue,
      orders: ordRes.data?.length || 0,
      products: prodRes.data?.length || 0,
      users: usrRes.data?.length || 0,
    });
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const uploadedUrls: string[] = [];
    for (const file of Array.from(e.target.files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error } = await supabase.storage.from('products').upload(fileName, file);
      if (error) { alert('Upload error: ' + error.message); setUploading(false); return; }
      const { data } = supabase.storage.from('products').getPublicUrl(fileName);
      if (data.publicUrl) uploadedUrls.push(data.publicUrl);
    }
    setImageUrls(prev => [...prev, ...uploadedUrls]);
    setUploading(false);
  };

  const removeImage = (idx: number) => setImageUrls(prev => prev.filter((_, i) => i !== idx));

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      seller_id: user.id, title, price: parseFloat(price), category,
      stock: parseInt(stock), description,
      images: imageUrls,
      colors: colors ? colors.split(',').map(c => c.trim()) : []
    };
    let error;
    if (editingId) {
      const res = await supabase.from('products').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('products').insert(payload);
      error = res.error;
    }
    if (error) { alert('Error: ' + error.message); return; }
    alert(editingId ? 'Product updated!' : 'Product added!');
    resetForm();
    await loadData();
    setTab('products');
  };

  const resetForm = () => {
    setTitle(''); setPrice(''); setCategory(''); setStock(''); setDescription(''); setColors(''); setImageUrls([]); setEditingId(null);
  };

  const editProduct = (p: any) => {
    setTitle(p.title); setPrice(String(p.price)); setCategory(p.category); setStock(String(p.stock));
    setDescription(p.description || ''); setColors((p.colors || []).join(', '));
    setImageUrls(p.images || []); setEditingId(p.id); setTab('add');
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

  if (!isAdmin) return <div className="p-10 text-center text-gray-400">Checking permissions...</div>;

  const statCards = [
    { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-gold-500 to-gold-700' },
    { label: 'Orders', value: stats.orders, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'from-blue-500 to-blue-700' },
    { label: 'Products', value: stats.products, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'from-emerald-500 to-emerald-700' },
    { label: 'Users', value: stats.users, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'from-purple-500 to-purple-700' },
  ];

  return (
    <div className="animate-fade-up">
      {/* Admin Header */}
      <div className="px-4 pt-4 pb-3 border-b border-dark-600 bg-dark-800/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold gold-text">Admin Panel</h1>
            <p className="text-xs text-gray-400">Manage your marketplace</p>
          </div>
          <button onClick={() => setTab('dashboard')} className="px-3 py-1.5 bg-dark-700 rounded-lg text-xs text-gray-300">← Back</button>
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {(['dashboard', 'products', 'orders', 'users', 'add'] as AdminTab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); if (t !== 'add') resetForm(); }} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${tab === t ? 'gold-gradient text-dark-900' : 'bg-dark-700 text-gray-400'}`}>
              {t === 'add' ? (editingId ? 'Edit' : 'Add New') : t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3"><div className="h-24 shimmer rounded-2xl" /><div className="h-24 shimmer rounded-2xl" /><div className="h-24 shimmer rounded-2xl" /><div className="h-24 shimmer rounded-2xl" /></div>
        ) : tab === 'dashboard' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((s, i) => (
                <div key={i} className="glass-card p-4 relative overflow-hidden">
                  <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.color} opacity-20 blur-xl`} />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
                  </div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="text-xl font-bold text-white mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Recent Activity
              </h3>
              <div className="space-y-2">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex justify-between items-center py-2 border-b border-dark-600 last:border-0">
                    <div>
                      <p className="text-xs text-white">Order #{o.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-gray-500">{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                    <span className="text-sm font-bold gold-text">${o.total_amount}</span>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No orders yet</p>}
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="font-bold text-white mb-3">Top Categories</h3>
              <div className="space-y-2">
                {products.reduce((acc: any[], p) => { const e = acc.find(x => x.cat === p.category); if (e) e.count++; else acc.push({ cat: p.category, count: 1 }); return acc; }, []).map((c, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">{c.cat}</span>
                    <span className="text-xs font-semibold text-gold-500">{c.count} items</span>
                  </div>
                ))}
                {products.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No products yet</p>}
              </div>
            </div>
          </div>
        ) : tab === 'products' ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-white">All Products ({products.length})</h2>
              <button onClick={() => { resetForm(); setTab('add'); }} className="btn-gold text-xs py-2 px-4">+ Add New</button>
            </div>
            {products.length === 0 ? (
              <div className="glass-card p-10 text-center"><p className="text-gray-400">No products yet</p></div>
            ) : products.map(p => (
              <div key={p.id} className="glass-card p-3 flex gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-dark-700 flex-shrink-0">
                  {p.images?.[0] ? <Image src={p.images[0]} alt={p.title} fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-gold-500/30">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">{p.title}</h3>
                  <p className="text-xs text-gray-400">{p.category} • Stock: {p.stock}</p>
                  <p className="text-sm font-bold gold-text mt-1">${p.price}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => editProduct(p)} className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold">Edit</button>
                  <button onClick={() => deleteProduct(p.id)} className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold">Del</button>
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'orders' ? (
          <div className="space-y-3">
            <h2 className="font-bold text-white mb-3">All Orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <div className="glass-card p-10 text-center"><p className="text-gray-400">No orders yet</p></div>
            ) : orders.map(o => (
              <div key={o.id} className="glass-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-500">#{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-lg font-bold gold-text">${o.total_amount}</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">📍 {o.country} • {(o.shipping_address as any)?.name || 'No address'}</p>
                <div className="flex gap-1 flex-wrap">
                  {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
                    <button key={s} onClick={() => updateOrderStatus(o.id, s)} className={`px-2 py-1 rounded text-[10px] font-semibold capitalize transition-all ${o.status === s ? 'gold-gradient text-dark-900' : 'bg-dark-700 text-gray-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'users' ? (
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
        ) : tab === 'add' ? (
          <form onSubmit={handleSaveProduct} className="space-y-3">
            <h2 className="font-bold text-white mb-3">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <input placeholder="Product Title" value={title} onChange={e => setTitle(e.target.value)} className="input-dark" required />
            <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="input-dark" rows={3} required />
            <input placeholder="Category (e.g., Electronics, Fashion)" value={category} onChange={e => setCategory(e.target.value)} className="input-dark" required />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="input-dark" required />
              <input placeholder="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)} className="input-dark" required />
            </div>
            <input placeholder="Colors (comma-separated: Red, Blue, Black)" value={colors} onChange={e => setColors(e.target.value)} className="input-dark" />
            
            <div className="glass-card p-4 space-y-3">
              <label className="block text-sm font-semibold text-white">Product Images</label>
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={uploading} className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-500 file:text-dark-900 file:cursor-pointer disabled:opacity-50" />
              {uploading && <p className="text-xs text-gold-500 animate-pulse">Uploading...</p>}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative h-20 rounded-lg overflow-hidden border border-dark-600">
                      <Image src={url} alt="" fill className="object-cover" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">✕</button>
                    </div>
          ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {editingId && <button type="button" onClick={() => { resetForm(); setTab('products'); }} className="btn-outline-gold flex-1">Cancel</button>}
              <button type="submit" className="btn-gold flex-1">{editingId ? 'Update Product' : 'Add Product'}</button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}