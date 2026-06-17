
import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
    Search, Filter, Inbox, MessageCircle, Instagram, Facebook, 
    MoreVertical, Phone, Video, Send, Paperclip, Smile, ArrowLeft 
} from 'lucide-react';
import { Message, Profile } from '../types';

type Platform = 'whatsapp' | 'instagram' | 'messenger';

interface UnifiedThread {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    platform: Platform; // Virtual field for the inbox
    unreadCount: number;
}

const UnifiedInbox = () => {
  const { user, profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | Platform>('all');
  const [threads, setThreads] = useState<UnifiedThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Conversations and "Simulate" Platforms
  useEffect(() => {
    if (!user) return;
    
    const fetchThreads = async () => {
        const { data } = await supabase
            .from('conversation_participants')
            .select('conversation_id, conversations(id, name, updated_at)')
            .eq('user_id', user.id);
            
        if (data) {
            // In a real production DB, 'platform' would be a column in the 'conversations' table.
            // For this Super App demo, we deterministically assign a platform based on ID char code to show functionality.
            const mappedThreads: UnifiedThread[] = data.map((d: any, index) => {
                const conv = Array.isArray(d.conversations) ? d.conversations[0] : d.conversations;
                const platformOptions: Platform[] = ['whatsapp', 'instagram', 'messenger'];
                const safeId = conv?.id || `temp_${index}`;
                const platform = platformOptions[safeId.charCodeAt(0) % 3]; 
                
                return {
                    id: safeId,
                    name: conv?.name || 'User',
                    avatar: `https://picsum.photos/seed/${safeId}/100`,
                    lastMessage: 'Click to read message',
                    time: new Date(conv?.updated_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    platform: platform,
                    unreadCount: Math.floor(Math.random() * 3) // Mock unread
                };
            });
            setThreads(mappedThreads);
        }
    };
    fetchThreads();
  }, [user]);

  // Load Messages for Active Thread
  useEffect(() => {
    if (!activeThreadId) return;

    const fetchMsgs = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', activeThreadId)
            .order('created_at', { ascending: true });
        if (data) setMessages(data as Message[]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    fetchMsgs();

    const channel = supabase.channel(`inbox:${activeThreadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeThreadId}` }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeThreadId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !activeThreadId) return;
    await supabase.from('messages').insert({
        conversation_id: activeThreadId,
        sender_id: user.id,
        content: newMessage,
        message_type: 'text'
    });
    setNewMessage('');
  };

  const getPlatformIcon = (p: Platform) => {
      switch(p) {
          case 'whatsapp': return <MessageCircle size={16} className="text-green-500" />;
          case 'instagram': return <Instagram size={16} className="text-pink-500" />;
          case 'messenger': return <Facebook size={16} className="text-blue-500" />;
      }
  };

  const getPlatformColor = (p: Platform) => {
      switch(p) {
          case 'whatsapp': return 'bg-green-600';
          case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500';
          case 'messenger': return 'bg-blue-600';
          default: return 'bg-gray-700';
      }
  };

  const filteredThreads = activeFilter === 'all' ? threads : threads.filter(t => t.platform === activeFilter);
  const activeThreadData = threads.find(t => t.id === activeThreadId);

  return (
    <div className="flex h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-gray-100 overflow-hidden font-sans">
      
      {/* 1. Filter Sidebar (Mini) */}
      <div className="w-16 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-4 bg-gray-50 dark:bg-[#121212]">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl mb-2">
              <Inbox size={24} />
          </div>
          
          <FilterBtn 
            active={activeFilter === 'all'} 
            onClick={() => setActiveFilter('all')} 
            label="All"
            icon={<Filter size={20} />} 
          />
          <FilterBtn 
            active={activeFilter === 'whatsapp'} 
            onClick={() => setActiveFilter('whatsapp')} 
            label="WA"
            icon={<MessageCircle size={20} />} 
            color="text-green-500"
          />
          <FilterBtn 
            active={activeFilter === 'instagram'} 
            onClick={() => setActiveFilter('instagram')} 
            label="IG"
            icon={<Instagram size={20} />} 
            color="text-pink-500"
          />
          <FilterBtn 
            active={activeFilter === 'messenger'} 
            onClick={() => setActiveFilter('messenger')} 
            label="FB"
            icon={<Facebook size={20} />} 
            color="text-blue-500"
          />
      </div>

      {/* 2. Thread List */}
      <div className={`${activeThreadId ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[380px] flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
              <h1 className="font-bold text-xl">Inbox</h1>
              <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><Search size={20}/></button>
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
              {filteredThreads.map(thread => (
                  <div 
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`flex gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors border-b border-gray-100 dark:border-gray-900 ${activeThreadId === thread.id ? 'bg-blue-50 dark:bg-[#1a1a1a]' : ''}`}
                  >
                      <div className="relative">
                          <img src={thread.avatar} className="w-12 h-12 rounded-full object-cover" />
                          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-black p-0.5 rounded-full">
                              {getPlatformIcon(thread.platform)}
                          </div>
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                              <span className="font-bold truncate">{thread.name}</span>
                              <span className="text-xs text-gray-400">{thread.time}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-500 truncate">{thread.lastMessage}</p>
                              {thread.unreadCount > 0 && (
                                  <span className="w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                      {thread.unreadCount}
                                  </span>
                              )}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* 3. Conversation View */}
      {activeThreadId && activeThreadData ? (
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-[#0a0a0a] relative">
              {/* Header */}
              <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] flex items-center justify-between px-4 z-10">
                  <div className="flex items-center gap-3">
                      <button className="md:hidden" onClick={() => setActiveThreadId(null)}><ArrowLeft/></button>
                      <div className="relative">
                          <img src={activeThreadData.avatar} className="w-10 h-10 rounded-full" />
                          <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-black p-0.5 rounded-full">
                              {getPlatformIcon(activeThreadData.platform)}
                          </div>
                      </div>
                      <div>
                          <h2 className="font-bold text-sm">{activeThreadData.name}</h2>
                          <span className="text-xs text-gray-500 capitalize">{activeThreadData.platform} • Active now</span>
                      </div>
                  </div>
                  <div className="flex gap-4 text-gray-400">
                      <Phone size={20} className="hover:text-blue-500 cursor-pointer" />
                      <Video size={20} className="hover:text-blue-500 cursor-pointer" />
                      <MoreVertical size={20} className="hover:text-gray-200 cursor-pointer" />
                  </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, i) => {
                      const isMe = msg.sender_id === user?.id;
                      const bubbleColor = isMe ? getPlatformColor(activeThreadData.platform) : 'bg-white dark:bg-[#262626]';
                      
                      return (
                          <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm ${bubbleColor} ${isMe ? 'text-white' : 'text-black dark:text-gray-200'}`}>
                                  {msg.content}
                              </div>
                          </div>
                      )
                  })}
                  <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
                  <div className="flex gap-2 text-gray-400">
                      <Paperclip size={24} className="cursor-pointer hover:text-gray-600 dark:hover:text-gray-200" />
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-full px-4 py-2 flex items-center gap-2">
                      <input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="bg-transparent border-none outline-none w-full text-sm"
                        placeholder={`Message on ${activeThreadData.platform}...`}
                      />
                      <Smile size={20} className="text-gray-400 cursor-pointer" />
                  </div>
                  <button 
                    onClick={handleSend}
                    className={`p-2 rounded-full text-white ${getPlatformColor(activeThreadData.platform)}`}
                  >
                      <Send size={20} />
                  </button>
              </div>
          </div>
      ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-[#0f0f0f] text-gray-400">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Inbox size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">Unified Inbox</h3>
              <p>Select a conversation from WhatsApp, Instagram, or Messenger.</p>
          </div>
      )}
    </div>
  );
};

const FilterBtn = ({ active, onClick, icon, color }: any) => (
    <button 
        onClick={onClick}
        className={`p-3 rounded-xl transition-all ${active ? 'bg-gray-200 dark:bg-gray-800 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-900'} ${active && color ? color : 'text-gray-500'}`}
    >
        {icon}
    </button>
);

export default UnifiedInbox;
