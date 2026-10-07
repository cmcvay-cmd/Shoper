'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Message = { id: string; content: string; sender_id: string; type: string; metadata: any; created_at: string };

export default function SupportChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState('Support Team');
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      // Find the admin user
      const { data: admin } = await supabase.from('profiles').select('id, full_name').eq('role', 'admin').limit(1).single();
      if (admin) {
        setAdminName(admin.full_name || 'Admin Support');
        
        // Get or create a support chat room
        const { data: room, error: roomError } = await supabase
          .from('chat_rooms')
          .upsert({
            buyer_id: user.id,
            seller_id: admin.id, // Using seller_id column to store admin ID for support chats
            product_id: null
          }, { onConflict: 'buyer_id,seller_id' })
          .select()
          .single();

        if (room && !roomError) {
          setRoomId(room.id);
          
          // Fetch existing messages
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('room_id', room.id)
            .order('created_at', { ascending: true })
            .limit(100);
          
          if (msgs) setMessages(msgs);

          // Subscribe to real-time updates
          const channel = supabase.channel(`support-chat:${room.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` }, (payload) => {
              setMessages(prev => [...prev, payload.new as Message]);
            })
            .subscribe();
            
          return () => { supabase.removeChannel(channel); };
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !userId || !roomId) return;
    
    await supabase.from('messages').insert({ 
      room_id: roomId, 
      sender_id: userId, 
      content: newMsg, 
      type: 'text' 
    });
    setNewMsg('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="p-10 text-center animate-fade-up">
        <p className="text-gray-400">Unable to connect to support. Please try again later.</p>
        <button onClick={() => router.push('/')} className="mt-4 btn-gold text-sm">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-dark-800 border-b border-dark-600 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-dark-900 font-bold text-sm">
          {adminName[0].toUpperCase()}
        </div>
        <div>
          <h2 className="font-semibold text-white text-sm">{adminName}</h2>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-dark-900">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">Start a conversation with our support team.</p>
            <p className="text-gray-600 text-xs mt-1">We typically reply within a few minutes.</p>
          </div>
        )}
        
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'} animate-fade-up`}>
            {msg.type === 'order_card' ? (
              <div className="glass-card p-4 max-w-[85%] border-l-4 border-l-gold-500">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-dark-900 font-bold text-sm">🛒</div>
                  <div>
                    <p className="font-bold text-gold-500 text-sm">Order Inquiry</p>
                    <p className="text-[10px] text-gray-500">#{msg.metadata?.orderId?.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="space-y-1 mt-2">
                  {msg.metadata?.items?.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-300">{it.title} × {it.qty}</span>
                      <span className="text-white">${(it.price * it.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dark-600 mt-2 pt-2 flex justify-between">
                  <span className="text-xs text-gray-400">Total</span>
                  <span className="font-bold gold-text">${msg.metadata?.total?.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                msg.sender_id === userId 
                  ? 'gold-gradient text-dark-900 rounded-br-sm' 
                  : 'bg-dark-800 text-white border border-dark-600 rounded-bl-sm'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className="text-[10px] opacity-60 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-3 bg-dark-800 border-t border-dark-600 flex gap-2">
        <input 
          value={newMsg} 
          onChange={e => setNewMsg(e.target.value)} 
          placeholder="Type your message or complaint..." 
          className="flex-1 bg-dark-700 border border-dark-600 rounded-full px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-all" 
        />
        <button type="submit" className="w-11 h-11 gold-gradient rounded-full flex items-center justify-center shadow-lg shadow-gold-500/30 hover:scale-105 active:scale-95 transition-all">
          <svg className="w-5 h-5 text-dark-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}