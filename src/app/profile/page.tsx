'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
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

  if (!user) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-4 pb-24">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white mb-6">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mb-3">
          {profile?.full_name?.[0] || user.email?.[0].toUpperCase()}
        </div>
        <h2 className="text-xl font-bold">{profile?.full_name || 'User'}</h2>
        <p className="text-sm opacity-90">{user.email}</p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg">My Orders ({orders.length})</h3>
        {orders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders yet</p>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">Order #{order.id.slice(0, 8)}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {order.status}
                </span>
              </div>
              <p className="font-bold text-amber-600">${order.total_amount}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>

      <button 
        onClick={handleLogout}
        className="w-full mt-8 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
}