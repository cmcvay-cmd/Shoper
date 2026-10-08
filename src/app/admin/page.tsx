'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type AdminTab = 'dashboard' | 'products' | 'add' | 'orders' | 'users' | 'banking';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, users: 0 });
  
  // Product form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [colors, setColors] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Banking form state
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [newBank, setNewBank] = useState({ 
    bank_name: '', 
    routing_number: '', 
    account_number: '', 
    account_name: '', 
    swift_code: '' 
  });
  const [loadingBanking, setLoadingBanking] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { 
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || profile.role !== 'admin') {
        router.push('/');
        return;
      }
      
      setHasAccess(true);
      loadData(); 
      loadBankDetails(); 
    };
    
    checkAdminAccess();
  }, []);

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
      setStats({ 
        revenue, 
        orders: ordRes.data?.length || 0, 
        products: prodRes.data?.length || 0, 
        users: usrRes.data?.length || 0 
      });
    } catch (err) { 
      console.error('Load error:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  const loadBankDetails = async () => {
    setLoadingBanking(true);
    const { data } = await supabase.from('bank_transfer_details').select('*').order('created_at', { ascending: false });
    if (data) setBankDetails(data);
    setLoadingBanking(false);
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('bank_transfer_details').insert(newBank);
    if (error) { 
      alert('Error: ' + error.message); 
      return; 
    }
    alert('Bank details added!');
    setNewBank({ bank_name: '', routing_number: '', account_number: '', account_name: '', swift_code: '' });
    loadBankDetails();
  };

  const toggleBankStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('bank_transfer_details').update({ is_active: !currentStatus }).eq('id', id);
    loadBankDetails();
  };

  const deleteBank = async (id: string) => {
    if (!confirm('Delete this bank account?')) return;
    await supabase.from('bank_transfer_details').delete().eq('id', id);
    loadBankDetails();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    const files = Array.from(e.target.files);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
      if (uploadError) { 
        alert('Upload failed: ' + uploadError.message); 
        setUploading(false); 
        return; 
      }
      
      const { data } = supabase.storage.from('products').getPublicUrl(fileName);
      if (data.publicUrl) newUrls.push(data.publicUrl);
    }
    
    setImageUrls(prev => [...prev, ...newUrls]);
    setUploading(false);
  };

  const removeImage = (idx: number) => setImageUrls(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { 
      alert('Not logged in'); 
      setFormLoading(false); 
      return; 
    }
    
    const payload = { 
      seller_id: user.id, 
      title, 
      description, 
      price: parseFloat(price), 
      category, 
      stock: parseInt(stock), 
      colors: colors ? colors.split(',').map(c => c.trim()) : [], 
      images: imageUrls 
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
    setTitle(''); 
    setDescription(''); 
    setPrice(''); 
    setCategory(''); 
    setStock(''); 
    setColors(''); 
    setImageUrls([]); 
    setEditingId(null); 
  };
  
  const editProduct = (p: any) => { 
    setTitle(p.title); 
    setDescription(p.description || ''); 
    setPrice(String(p.price)); 
    setCategory(p.category); 
    setStock(String(p.stock)); 
    setColors((p.colors || []).join(', ')); 
    setImageUrls(p.images || []); 
    setEditingId(p.id); 
    setActiveTab('add'); 
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
    await supabase.from('profiles').update({ role: currentRole === 'admin' ? 'customer' : 'admin' }).eq('id', userId); 
    await loadData(); 
  };

  // Access Control Check
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gold-500">Checking access...</p>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gold-500">Loading dashboard...</p>
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
          <button onClick={() => router.push('/')} className="px-3 py-1.5 bg-dark-700 rounded-lg text-xs text-gray-300 hover:bg-dark-600 transition-colors">
            ← Store
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(['dashboard', 'products', 'add', 'orders', 'users', 'banking'] as AdminTab[]).map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === tab ? 'gold-gradient text-dark-900' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
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
              <div className="glass-card p-10 text-center"><p className="text-gray-400">No products yet</p></div>
            ) : products.map(p => (
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
            ))}
          </div>
        )}

        {/* Add/Edit Product Tab */}
        {activeTab === 'add' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-bold text-white text-lg">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <input placeholder="Product Title" value={title} onChange={(e) => setTitle(e.target.value)} className="input-dark" required />
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="input-dark" rows={3} required />
            <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="input-dark" required />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input-dark" required />
              <input placeholder="Stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="input-dark" required />
            </div>
            <input placeholder="Colors (Red, Blue)" value={colors} onChange={(e) => setColors(e.target.value)} className="input-dark" />
            <div className="glass-card p-4">
              <label className="block text-sm font-semibold text-white mb-3">Product Images</label>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading} className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold-500 file:text-dark-900 file:cursor-pointer disabled:opacity-50" />
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative h-24 rounded-lg overflow-hidden border border-dark-600">
                      <Image src={url} alt="" fill className="object-cover" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">✕</button>
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
                  {['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'pending_transfer'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => updateOrderStatus(o.id, s)} 
                      className={`px-2 py-1 rounded text-[10px] font-semibold capitalize transition-all ${
                        o.status === s ? 'gold-gradient text-dark-900' : 'bg-dark-700 text-gray-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
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
                <button 
                  onClick={() => toggleUserRole(u.id, u.role || 'customer')} 
                  className={`px-3 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all ${
                    u.role === 'admin' ? 'bg-gold-500/20 border border-gold-500/30 text-gold-500' : 'bg-dark-700 text-gray-400 border border-dark-600'
                  }`}
                >
                  {u.role || 'customer'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Banking Tab */}
        {activeTab === 'banking' && (
          <div className="space-y-4">
            <h2 className="font-bold text-white text-lg">Bank Transfer Details</h2>
            
            {/* Add Bank Form */}
            <form onSubmit={handleAddBank} className="glass-card p-4 space-y-3">
              <h3 className="font-semibold text-white">Add New Bank Account (e.g., Netspend)</h3>
              <input 
                placeholder="Bank Name (e.g., MetaBank, N.A.)" 
                value={newBank.bank_name} 
                onChange={e => setNewBank({...newBank, bank_name: e.target.value})} 
                className="input-dark" 
                required 
              />
              <input 
                placeholder="Routing Number (9 digits)" 
                value={newBank.routing_number} 
                onChange={e => setNewBank({...newBank, routing_number: e.target.value})} 
                className="input-dark" 
                maxLength={9}
                required 
              />
              <input 
                placeholder="Account Number" 
                value={newBank.account_number} 
                onChange={e => setNewBank({...newBank, account_number: e.target.value})} 
                className="input-dark" 
                required 
              />
              <input 
                placeholder="Account Holder Name" 
                value={newBank.account_name} 
                onChange={e => setNewBank({...newBank, account_name: e.target.value})} 
                className="input-dark" 
                required 
              />
              <input 
                placeholder="SWIFT Code (Optional)" 
                value={newBank.swift_code} 
                onChange={e => setNewBank({...newBank, swift_code: e.target.value})} 
                className="input-dark" 
              />
              <button type="submit" className="btn-gold w-full">Add Bank Account</button>
            </form>

            {/* Bank List */}
            {loadingBanking ? (
              <div className="text-center py-8 text-gray-400">Loading bank details...</div>
            ) : (
              <div className="space-y-3">
                {bankDetails.map((bank) => (
                  <div key={bank.id} className="glass-card p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{bank.bank_name}</h3>
                        <p className="text-sm text-gray-400 font-mono">Routing: {bank.routing_number || 'N/A'}</p>
                        <p className="text-sm text-gray-400 font-mono">Account: {bank.account_number}</p>
                        <p className="text-xs text-gray-500">{bank.account_name}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        bank.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {bank.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => toggleBankStatus(bank.id, bank.is_active)} 
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                      >
                        {bank.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => deleteBank(bank.id)} 
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {bankDetails.length === 0 && (
                  <p className="text-center text-gray-400 py-4">No bank accounts added yet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}