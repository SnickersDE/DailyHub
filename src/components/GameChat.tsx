import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';

interface Message {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
  sender_name?: string;
}

interface Props {
  gameId: string;
}

export const GameChat: React.FC<Props> = ({ gameId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameId) return;

    // Load initial messages (if we had a messages table, but for now we use realtime broadcast or ephemeral)
    // Since we don't have a messages table in the schema provided earlier, let's assume we use Supabase Realtime Broadcast 
    // for ephemeral chat, OR we create a table. 
    // Given the instructions, a simple realtime chat is requested.
    // Let's use Broadcast for now as it's fastest and requires no schema changes, but messages are lost on reload.
    // If persistence is needed, we'd need a table.
    // User asked for "Realtime chat", usually implies persistence isn't strictly required but nice.
    // Let's stick to Broadcast for simplicity and speed, or check if we can quickly add a table.
    // Actually, ephemeral is fine for "while playing".

    const channel = supabase.channel(`game_chat:${gameId}`)
      .on('broadcast', { event: 'message' }, (payload) => {
        setMessages(prev => [...prev, payload.payload]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const msg: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      text: inputText.trim(),
      created_at: new Date().toISOString(),
      sender_name: user.user_metadata?.username || 'Spieler' // Fallback
    };

    // Send via broadcast
    await supabase.channel(`game_chat:${gameId}`).send({
      type: 'broadcast',
      event: 'message',
      payload: msg
    });

    // Add to local immediately
    setMessages(prev => [...prev, msg]);
    setInputText('');
  };

  return (
    <div className={clsx(
      "fixed bottom-20 right-4 z-50 flex flex-col items-end transition-all duration-300",
      isOpen ? "w-80" : "w-auto"
    )}>
      {isOpen && (
        <div className="bg-white rounded-t-xl rounded-bl-xl shadow-2xl border border-gray-200 w-full overflow-hidden mb-2 animate-in slide-in-from-bottom-5 fade-in duration-300 text-gray-900">
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 font-bold flex justify-between items-center">
            <span>Chat</span>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 rounded p-1">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-900 text-sm mt-4">Schreib etwas...</div>
            )}
            {messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <div className={clsx(
                    "max-w-[85%] px-3 py-2 rounded-lg text-sm shadow-sm",
                    isMe ? "bg-blue-500 text-white rounded-br-none" : "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-900 mt-1 px-1">
                    {isMe ? 'Du' : msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="p-2 bg-white border-t flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Nachricht..."
              className="flex-1 border rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={sendMessage}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-md"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "p-4 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center relative",
          isOpen ? "bg-gray-200 text-gray-900" : "bg-blue-600 text-white"
        )}
      >
        <MessageSquare size={24} />
        {!isOpen && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
            {messages.length}
          </span>
        )}
      </button>
    </div>
  );
};
