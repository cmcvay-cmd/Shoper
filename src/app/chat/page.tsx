'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

type Message = { 
  id: string; 
  content: string; 
  sender_id: string; 
  created_at: string; 
  profiles?: { full_name: string | null } | null; 
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !roomId) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('messages')
        .select('*, profiles(full_name)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (data) setMessages(data as Message[]);

      const channel = supabase.channel(`chat:${roomId}`)
        .on(
          'postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, 
          async (payload) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', payload.new.sender_id)
              .single();
            
            // Explicitly cast to satisfy TypeScript
            const newMessage: Message = {
              ...(payload.new as any),
              profiles: profile
            };
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [roomId]);

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !userId || !roomId) return;
    await supabase.from('messages').insert({ room_id: roomId, sender_id: userId, content: newMsg });
    setNewMsg('');
  };

  if (!roomId) {
    return <div className="text-center py-20 text-gray-500">Select a product and click "Chat" to start messaging.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm flex flex-col h-[70vh]">
      <div className="p-4 border-b font-semibold">Chat Room</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.sender_id === userId ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {msg.sender_id !== userId && <p className="text-xs font-semibold mb-1 opacity-70">{msg.profiles?.full_name || 'Unknown'}</p>}
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
        <input 
          value={newMsg} 
          onChange={e => setNewMsg(e.target.value)} 
          placeholder="Type a message..." 
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
        <button type="submit" className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700 font-semibold">Send</button>
      </form>
    </div>
  );
}