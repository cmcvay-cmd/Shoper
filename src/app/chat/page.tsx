'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

type Message = { id: string; content: string; sender_id: string; type: string; metadata: any; created_at: string };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const queryRoomId = searchParams.get('room');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      let targetRoomId = queryRoomId;
      if (!targetRoomId) {
        const { data: room } = await supabase.from('chat_rooms').select('id').eq('buyer_id', user.id).order('created_at', { ascending: false }).limit(1).single();
        if (room) targetRoomId = room.id;
      }
      if (!targetRoomId) return;
      setRoomId(targetRoomId);

      const { data } = await supabase.from('messages').select('*').eq('room_id', targetRoomId).order('created_at', { ascending: true }).limit(100);
      if (data) setMessages(data);

      const channel = supabase.channel(`chat:${targetRoomId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${targetRoomId}` }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [queryRoomId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !userId || !roomId) return;
    await supabase.from('messages').insert({ room_id: roomId, sender_id: userId, content: newMsg, type: 'text' });
    setNewMsg('');
  };

  if (!roomId) return (
    <div className="p-10 text-center animate-fade-up">
      <svg className="w-20 h-20 mx-auto text-gold-500/30 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      <p className="text-gray-400">No active chats yet</p>
      <p className="text-gray-500 text-sm mt-2">Buy a product to start chatting with sellers</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-dark-900">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'} animate-fade-up`}>
            {msg.type === 'order_card' ? (
              <div className="glass-card p-4 max-w-[85%] border-l-4 border-l-gold-500">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-dark-900 font-bold text-sm">✓</div>
                  <div>
                    <p className="font-bold text-gold-500 text-sm">Order Confirmed</p>
                    <p className="text-[10px] text-gray-500">#{msg.metadata?.orderId?.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="space-y-1 mt-2">
                  {msg.metadata?.items?.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs"><span className="text-gray-300">{it.title} × {it.qty}</span><span className="text-white">${(it.price * it.qty).toFixed(2)}</span></div>
                  ))}
                </div>
                <div className="border-t border-dark-600 mt-2 pt-2 flex justify-between">
                  <span className="text-xs text-gray-400">Total</span>
                  <span className="font-bold gold-text">${msg.metadata?.total?.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${msg.sender_id === userId ? 'gold-gradient text-dark-900 rounded-br-sm' : 'bg-dark-800 text-white border border-dark-600 rounded-bl-sm'}`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="p-3 bg-dark-800 border-t border-dark-600 flex gap-2">
        <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." className="flex-1 bg-dark-700 border border-dark-600 rounded-full px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500" />
        <button type="submit" className="w-11 h-11 gold-gradient rounded-full flex items-center justify-center shadow-lg shadow-gold-500/30">
          <svg className="w-5 h-5 text-dark-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </form>
    </div>
  );
}