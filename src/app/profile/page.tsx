'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [tab, setTab] = useState<'orders' | 'settings'>('orders');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      const { data: ordersData } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (ordersData) setOrders(ordersData);
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (!user) return <div className="p-10 text-center text-gray-400">Loading...</div>;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    paid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="p-4 animate-fade-up">
      <div className="glass-card p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 gold-gradient opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center text-dark-900 font-bold text-2xl">
            {profile?.full_name?.[0] || user.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{profile?.full_name || 'User'}</h2>
            <p className="text-sm text-gray-400 truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-gold-500/10 border border-gold-500/30 rounded text-[10px] font-semibold text-gold-500 uppercase">
              {profile?.role || 'customer'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('orders')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'orders' ? 'gold-gradient text-dark-900' : 'bg-dark-800 text-gray-400 border border-dark-600'}`}>
          Orders ({orders.length})
        </button>
        <button onClick={() => setTab('settings')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'settings' ? 'gold-gradient text-dark-900' : 'bg-dark-800 text-gray-400 border border-dark-600'}`}>
          Settings
        </button>
      </div>

      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-gray-400">No orders yet</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="glass-card p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[10px] text-gray-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold uppercase ${statusColors[order.status] || statusColors.pending}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-dark-600">
                <span className="text-xs text-gray-400">{order.country}</span>
                <span className="text-lg font-bold gold-text">${order.total_amount}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-3">
          <button onClick={() => alert('Profile editing coming soon!')} className="glass-card p-4 w-full flex justify-between items-center">
            <span className="text-sm text-white">Edit Profile</span>
            <span className="text-gold-500">→</span>
          </button>
          <button onClick={() => alert('Saved items coming soon!')} className="glass-card p-4 w-full flex justify-between items-center">
            <span className="text-sm text-white">Saved Items</span>
            <span className="text-gold-500">→</span>
          </button>
          <button onClick={() => alert('Help center coming soon!')} className="glass-card p-4 w-full flex justify-between items-center">
            <span className="text-sm text-white">Help & Support</span>
            <span className="text-gold-500">→</span>
          </button>
          <form action="/auth/signout" method="post">
            <button type="submit" className="w-full bg-red-500/10 border border-red-500/30 text-red-400 font-semibold py-3 rounded-xl hover:bg-red-500/20 transition-all">
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}