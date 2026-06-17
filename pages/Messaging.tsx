
import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { callService } from '../services/callService';
import { messagingService } from '../services/messagingService';
import { generateSmartReplies } from '../services/geminiService';
import { Search, Phone, Video, MoreVertical, Send, Paperclip, Mic, Smile, MessageSquare, ArrowLeft, X, UserPlus, Check, CheckCheck, Lock, Sparkles } from 'lucide-react';
import { Message, Profile } from '../types';
import VoiceRecorder from '../components/VoiceRecorder';

const Messaging = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isConfigured] = useState(isSupabaseConfigured());
  
  // Decryption Cache to avoid flicker
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});

  // New Chat / Group
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  
  // Media & Voice
  const [showRecorder, setShowRecorder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Smart Replies
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    if (!user || !isConfigured) return;
    
    const fetchConvos = async () => {
        const { data } = await supabase
            .from('conversation_participants')
            .select(`
                conversation_id, 
                conversations (id, name, is_group, group_avatar, updated_at)
            `)
            .eq('user_id', user.id)
            .order('joined_at', { ascending: false });
            
        if (data) {
            const formatted = await Promise.all(data.map(async (d: any) => {
                const conv = d.conversations;
                let name = conv.name;
                let avatar = conv.group_avatar;

                if (!conv.is_group) {
                    const { data: other } = await supabase
                        .from('conversation_participants')
                        .select('profiles(full_name, avatar_url)')
                        .eq('conversation_id', conv.id)
                        .neq('user_id', user.id)
                        .single();
                    if (other?.profiles) {
                        const p: any = other.profiles;
                        const profileData = Array.isArray(p) ? p[0] : p;
                        name = profileData?.full_name;
                        avatar = profileData?.avatar_url;
                    }
                }

                return {
                    id: conv.id,
                    name: name || 'Unknown',
                    avatar: avatar || `https://picsum.photos/seed/${conv.id}/100`,
                    is_group: conv.is_group,
                    time: new Date(conv.updated_at).toLocaleDateString()
                };
            }));
            setConversations(formatted);
        }
    };
    fetchConvos();
  }, [user, isConfigured]);

  useEffect(() => {
    if (!activeChatId || !isConfigured) return;

    const fetchMsgs = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', activeChatId)
            .order('created_at', { ascending: true });
        
        if (data) {
            setMessages(data as Message[]);
            // Decrypt incoming messages
            const loadedMessages: string[] = [];
            
            for (const msg of data as Message[]) {
                let content = msg.content;
                if (msg.is_encrypted && !decryptedCache[msg.id]) {
                    content = await messagingService.decryptMessageContent(activeChatId, msg.content);
                    setDecryptedCache(prev => ({...prev, [msg.id]: content}));
                }
                if (msg.message_type === 'text') loadedMessages.push(content);
            }
            
            // Mark as read
            const unreadIds = data.filter((m: Message) => m.sender_id !== user?.id && m.status !== 'read').map((m: Message) => m.id);
            if (unreadIds.length > 0) {
                messagingService.markAsRead(unreadIds);
            }

            // Generate Smart Replies if last message is not mine
            const lastMsg = data[data.length - 1];
            if (lastMsg && lastMsg.sender_id !== user?.id && lastMsg.message_type === 'text') {
                 generateSuggestions(loadedMessages);
            } else {
                setSmartSuggestions([]);
            }
        }
        scrollToBottom();
    };
    fetchMsgs();

    const channel = supabase.channel(`chat:${activeChatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeChatId}` }, 
        async (payload) => {
          const newMsg = payload.new as Message;
          let content = newMsg.content;
          
          if (newMsg.is_encrypted) {
              content = await messagingService.decryptMessageContent(activeChatId, newMsg.content);
              setDecryptedCache(prev => ({...prev, [newMsg.id]: content}));
          }
          
          setMessages(prev => [...prev, newMsg]);
          if (newMsg.sender_id !== user?.id) {
              messagingService.markAsRead([newMsg.id]);
              if (newMsg.message_type === 'text') {
                  // Trigger smart suggestions
                  generateSuggestions([content]); // Passing just last one for speed in this demo
              }
          } else {
              setSmartSuggestions([]);
          }
          scrollToBottom();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChatId, isConfigured]);

  const generateSuggestions = async (history: string[]) => {
      setSuggestionsLoading(true);
      const suggestions = await generateSmartReplies(history);
      setSmartSuggestions(suggestions);
      setSuggestionsLoading(false);
  };

  const safeAlert = (e: any, defaultMsg: string) => {
      let msg = defaultMsg;
      if (typeof e === 'string') msg = e;
      else if (e instanceof Error) msg = e.message;
      else if (e?.message) {
           if (typeof e.message === 'string') msg = e.message;
           else try { msg = JSON.stringify(e.message); } catch {}
      }
      else if (typeof e === 'object') {
          try { 
            const json = JSON.stringify(e); 
            if (json !== '{}') msg = json;
          } catch {}
      }
      alert(msg);
  };

  const handleSend = async (text: string = newMessage) => {
    try {
        if ((!text.trim()) || !user || !activeChatId) return;
        setNewMessage('');
        setSmartSuggestions([]); // Clear suggestions on send
        // Send
        await messagingService.sendMessage(activeChatId, user.id, text);
    } catch (e: any) {
        console.error("Send error", e);
        safeAlert(e, "Failed to send message");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
          if (e.target.files && e.target.files[0] && user && activeChatId) {
              const file = e.target.files[0];
              const type = file.type.startsWith('video') ? 'video' : 'image';
              await messagingService.sendMessage(activeChatId, user.id, '', type as any, file);
          }
      } catch (e: any) {
          console.error("Upload error", e);
          safeAlert(e, "Failed to upload file");
      }
  };

  const handleVoiceSend = async (blob: Blob) => {
      try {
          if (user && activeChatId) {
              await messagingService.sendMessage(activeChatId, user.id, '', 'voice_note', blob);
              setShowRecorder(false);
          }
      } catch (e: any) {
          console.error("Voice send error", e);
          safeAlert(e, "Failed to send voice note");
      }
  };

  const initiateCall = async (type: 'voice' | 'video') => {
      try {
          if (!activeChatId) return;
          const { data } = await supabase.from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', activeChatId)
            .neq('user_id', user?.id)
            .single();
          
          if (data && user) {
             await callService.startCall(user.id, data.user_id, type);
          }
      } catch (e: any) {
          console.error("Call error", e);
          safeAlert(e, "Failed to start call");
      }
  };

  const searchUsers = async (query: string) => {
      if (!query.trim()) return;
      const { data } = await supabase.from('profiles').select('*').ilike('username', `%${query}%`).limit(5);
      if (data) setSearchResults(data);
  };

  const startNewChat = async (targetUserId: string) => {
      try {
          if (!user) return;
          const { data: conv } = await supabase.from('conversations').insert({}).select().single();
          if (conv) {
              await supabase.from('conversation_participants').insert([
                  { conversation_id: conv.id, user_id: user.id },
                  { conversation_id: conv.id, user_id: targetUserId }
              ]);
              setActiveChatId(conv.id);
              setShowNewChatModal(false);
              window.location.reload(); 
          }
      } catch (e: any) {
          console.error("Chat creation error", e);
          safeAlert(e, "Failed to create chat");
      }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const MessageStatusIcon = ({ status }: { status: string }) => {
      if (status === 'sent') return <Check size={14} className="text-white" />;
      if (status === 'delivered') return <CheckCheck size={14} className="text-gray-400" />;
      if (status === 'read') return (
        <div className="flex items-center gap-1">
            <CheckCheck size={14} className="text-blue-400" />
            <span className="text-[8px] font-black uppercase text-blue-400">Seen</span>
        </div>
      );
      return null; // pending
  };

  return (
    <div className="flex h-screen bg-wa-bg overflow-hidden text-gray-200">
      {/* Sidebar */}
      <div className={`w-full md:w-[400px] border-r border-wa-incoming flex flex-col bg-wa-sidebar ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="h-16 bg-wa-incoming flex items-center justify-between px-4 border-r border-gray-800">
            <img src={profile?.avatar_url || 'https://picsum.photos/seed/me/100'} className="w-10 h-10 rounded-full" />
            <div className="flex gap-4 text-gray-400">
                <button onClick={() => setShowNewChatModal(true)} title="New Chat"><MessageSquare size={20} /></button>
                <MoreVertical size={20} />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {conversations.map(chat => (
                <div 
                    key={chat.id} 
                    onClick={() => setActiveChatId(chat.id)}
                    className={`flex items-center gap-4 p-3 cursor-pointer hover:bg-wa-incoming ${activeChatId === chat.id ? 'bg-wa-incoming' : ''}`}
                >
                    <img src={chat.avatar} className="w-12 h-12 rounded-full bg-gray-600" />
                    <div className="flex-1 border-b border-gray-800 pb-3">
                        <div className="flex justify-between">
                            <span className="text-white font-medium">{chat.name}</span>
                            <span className="text-xs text-gray-500">{chat.time}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      {activeChatId ? (
          <div className="flex-1 flex flex-col relative bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
             <div className="absolute inset-0 bg-black/90 z-0"></div>
             
             {/* Header */}
             <div className="h-16 bg-wa-incoming flex items-center justify-between px-4 z-10 border-l border-gray-800">
                <div className="flex items-center gap-4">
                    <button className="md:hidden" onClick={() => setActiveChatId(null)}><ArrowLeft/></button>
                    <img src={conversations.find(c => c.id === activeChatId)?.avatar} className="w-10 h-10 rounded-full bg-gray-600" />
                    <div className="flex flex-col">
                        <span className="font-medium text-white">{conversations.find(c => c.id === activeChatId)?.name}</span>
                        <span className="text-xs text-gray-400">Online</span>
                    </div>
                </div>
                <div className="flex gap-6 text-gray-400">
                    <button onClick={() => initiateCall('video')}><Video size={20} /></button>
                    <button onClick={() => initiateCall('voice')}><Phone size={20} /></button>
                    <Search size={20} />
                </div>
             </div>

             {/* Messages */}
             <div className="flex-1 overflow-y-auto p-4 z-10 space-y-2">
                <div className="flex justify-center my-4">
                    <span className="bg-yellow-900/40 text-yellow-200 text-[10px] px-3 py-1 rounded-lg flex items-center gap-1">
                        <Lock size={10} /> Messages are end-to-end encrypted. No one outside of this chat, not even OmniConnect, can read or listen to them.
                    </span>
                </div>

                {messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const displayContent = msg.is_encrypted ? (decryptedCache[msg.id] || "Decrypting...") : msg.content;

                    return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-2 rounded-lg text-sm shadow-md ${isMe ? 'bg-wa-outgoing text-white rounded-tr-none' : 'bg-wa-incoming text-white rounded-tl-none'}`}>
                                {msg.media_url && (
                                    msg.message_type === 'image' ? <img src={msg.media_url} className="max-w-full rounded mb-2" /> :
                                    msg.message_type === 'voice_note' ? <audio src={msg.media_url} controls className="w-48 mt-1 mb-1" /> : null
                                )}
                                <p className="whitespace-pre-wrap">{displayContent}</p>
                                <div className="flex justify-end items-center gap-1 mt-1">
                                    <span className="text-[10px] text-gray-300">
                                        {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </span>
                                    {isMe && <MessageStatusIcon status={msg.status} />}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
             </div>

             {/* Smart Replies */}
             {smartSuggestions.length > 0 && (
                 <div className="z-10 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
                     {suggestionsLoading && <span className="text-xs text-gray-500 animate-pulse">✨ OmniAI thinking...</span>}
                     {smartSuggestions.map((s, i) => (
                         <button 
                            key={i}
                            onClick={() => handleSend(s)}
                            className="bg-wa-incoming border border-gray-700 hover:bg-gray-700 text-xs px-3 py-1.5 rounded-full whitespace-nowrap text-wa-accent flex items-center gap-1 transition-colors"
                         >
                             <Sparkles size={10} /> {s}
                         </button>
                     ))}
                 </div>
             )}

             {/* Input */}
             <div className="bg-wa-incoming p-2 z-10 flex items-center gap-2 mb-16 md:mb-0">
                {showRecorder ? (
                    <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setShowRecorder(false)} />
                ) : (
                    <>
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-800 rounded-full">
                            <Paperclip size={24} className="text-gray-400" />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,video/*" />
                        
                        <div className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2 flex items-center gap-2">
                            <input 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message" 
                                className="bg-transparent border-none outline-none w-full text-white placeholder-gray-400" 
                            />
                        </div>
                        {newMessage ? (
                            <button onClick={() => handleSend()} className="p-2 bg-wa-accent rounded-full text-white"><Send size={20} /></button>
                        ) : (
                            <button onClick={() => setShowRecorder(true)} className="p-2 bg-wa-accent rounded-full text-white">
                                <Mic size={20} />
                            </button>
                        )}
                    </>
                )}
             </div>
          </div>
      ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-wa-sidebar border-b-8 border-wa-accent">
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-20 h-20 opacity-30 mb-4" />
              <h1 className="text-2xl text-gray-300 font-light">OmniConnect Web</h1>
              <p className="text-sm text-gray-500 mt-2">Send and receive messages without keeping your phone online.</p>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-6"><Lock size={12}/> End-to-end encrypted</p>
          </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-wa-sidebar w-full max-w-md rounded-xl p-4 shadow-2xl border border-gray-800">
                  <div className="flex justify-between mb-4 items-center">
                      <h3 className="text-lg font-bold text-gray-200">New Chat</h3>
                      <button onClick={() => setShowNewChatModal(false)}><X className="text-gray-400"/></button>
                  </div>
                  <input 
                    placeholder="Search username..." 
                    className="w-full bg-gray-800 p-3 rounded-lg mb-4 text-white focus:ring-1 focus:ring-wa-accent outline-none" 
                    onChange={e => { setUserSearchQuery(e.target.value); searchUsers(e.target.value); }}
                  />
                  <div className="space-y-2">
                    {searchResults.map(u => (
                        <div key={u.id} className="flex justify-between items-center p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition" onClick={() => startNewChat(u.id)}>
                            <div className="flex items-center gap-3">
                                <img src={u.avatar_url || 'https://picsum.photos/50'} className="w-10 h-10 rounded-full" />
                                <span>{u.username}</span>
                            </div>
                            <UserPlus size={18} className="text-wa-accent" />
                        </div>
                    ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Messaging;
