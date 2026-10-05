'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChatSellerButton({ sellerId, productId }: { sellerId: string, productId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleChat = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: room, error } = await supabase
      .from('chat_rooms')
      .upsert({ buyer_id: user.id, seller_id: sellerId, product_id: productId }, { onConflict: 'buyer_id,seller_id,product_id' })
      .select()
      .single();

    setLoading(false);
    if (room) router.push(`/chat?room=${room.id}`);
  };

  return (
    <button onClick={handleChat} disabled={loading} className="px-6 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
      {loading ? '...' : 'Chat'}
    </button>
  );
}