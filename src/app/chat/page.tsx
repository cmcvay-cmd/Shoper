'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type Message = { id: string, content: string, sender_id: string, type: string, metadata: any, created_at: string };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Get or create a default chat room for demo (replace with actual product logic)
      const { data: room } = await supabase.from('chat_rooms').select('id').eq('buyer_id', user.id).limit(1).single();
      if (room) setRoomId(room.id);

      if (room) {
        const { data } = await supabase.from('messages').select('*').eq('room_id', room.id).order('created_at');
        if (data) setMessages(data);

        const channel = supabase.channel(`chat:${room.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` }, (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          })
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      }
    };
    init();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !userId || !roomId) return;
    await supabase.from('messages').insert({ room_id: roomId, sender_id: userId, content: newMsg, type: 'text' });
    setNewMsg('');
  };

  if (!roomId) return <div className="p-10 text-center text-gray-500">No active chats. Buy a product to start chatting!</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'order_card' ? (
              <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 max-w-[85%]">
                <p className="font-bold text-green-600 mb-2">✅ Order Confirmed!</p>
                <p className="text-sm text-gray-600">Order ID: {msg.metadata.orderId}</p>
                <p className="text-sm font-bold">Total: ${msg.metadata.total}</p>
                <p className="text-xs text-gray-400 mt-2">Seller will contact you shortly.</p>
              </div>
            ) : (
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.sender_id === userId ? 'bg-amber-500 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                <p>{msg.content}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="p-3 border-t bg-white flex gap-2">
        <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." className="flex-1 p-3 bg-gray-100 rounded-full focus:outline-none" />
        <button type="submit" className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </form>
    </div>
  );
}