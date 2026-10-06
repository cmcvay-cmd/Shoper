'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Check if admin - but don't get stuck in loop
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // If not admin, SET admin role instead of redirecting
      if (!profile || profile.role !== 'admin') {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
      }

      // Load products
      await loadProducts();
      setLoading(false);
    };

    checkAuth();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gold-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold gold-text">Admin Dashboard</h1>
        <button onClick={() => router.push('/')} className="text-sm text-gray-400">Back to Store</button>
      </div>

      {/* Simple Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['Dashboard', 'Products', 'Add Product'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
              activeTab === tab.toLowerCase() 
                ? 'gold-gradient text-dark-900' 
                : 'bg-dark-800 text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <p className="text-gray-400 text-sm">Total Products</p>
            <p className="text-3xl font-bold gold-text mt-2">{products.length}</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-gray-400 text-sm">Status</p>
            <p className="text-lg font-bold text-green-500 mt-2">Active</p>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-gray-400">No products yet</p>
            </div>
          ) : (
            products.map(p => (
              <div key={p.id} className="glass-card p-4">
                <h3 className="font-semibold text-white">{p.title}</h3>
                <p className="text-sm text-gray-400">${p.price} • {p.category}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Product Tab */}
      {activeTab === 'addproduct' && (
        <div className="glass-card p-6">
          <p className="text-gray-400 text-center">Use the admin panel from earlier to add products</p>
        </div>
      )}
    </div>
  );
}