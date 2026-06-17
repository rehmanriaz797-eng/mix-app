
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    X, Send, Mic, Image as ImageIcon, Smile, 
    Settings, ShieldAlert, Flag, CheckCheck, 
    MoreVertical, Bot, Zap, DollarSign, Lock,
    Check, Bell, Shield, UserX, AlertCircle,
    Globe, Users, Crown, ChevronRight, Loader2,
    CheckCircle2, Volume2, Camera, Paperclip,
    MessageSquare, ArrowLeft, Search, Filter
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
    getCreatorMessages, saveCreatorMessage, 
    getCreatorSettings, saveCreatorSettings,
    updateMessageStatus, updateWallet,
    getAllCreatorConversations
} from '../services/storageService';
import { CreatorMessage, Profile, CreatorMessagingSettings, MessageStatus } from '../types';
import { moderateContent } from '../services/geminiService';

interface CreatorChatPanelProps {
    creator: Profile;
    onClose: () => void;
}

const CreatorChatPanel: React.FC<CreatorChatPanelProps> = ({ creator, onClose }) => {
    const { user, profile } = useAuth();
    const isOwnChannel = user?.id === creator.id;
    
    const [view, setView] = useState<'list' | 'chat' | 'settings'>(isOwnChannel ? 'list' : 'chat');
    const [selectedConv, setSelectedConv] = useState<any | null>(null);
    const [messages, setMessages] = useState<CreatorMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [settings, setSettings] = useState<CreatorMessagingSettings>(getCreatorSettings(creator.id));
    const [isSending, setIsSending] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [offsetX, setOffsetX] = useState(0);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get conversations list for owners
    const conversations = useMemo(() => isOwnChannel ? getAllCreatorConversations(creator.id) : [], [isOwnChannel, creator.id, messages]);

    // Determine current conversation ID
    const convId = useMemo(() => {
        if (!isOwnChannel) return [user?.id, creator.id].sort().join('_');
        return selectedConv?.id || '';
    }, [user?.id, creator.id, selectedConv, isOwnChannel]);

    useEffect(() => {
        if (view === 'chat' && convId) {
            setMessages(getCreatorMessages(convId));
            scrollToBottom();
        }

        const handleNewMsg = (e: any) => {
            const msg = e.detail;
            if (msg.conversation_id === convId && msg.sender_id !== user?.id) {
                setMessages(prev => [...prev, msg]);
                scrollToBottom();
                if (navigator.vibrate) navigator.vibrate(5);
            }
        };
        window.addEventListener('at_new_message', handleNewMsg);
        
        return () => window.removeEventListener('at_new_message', handleNewMsg);
    }, [convId, view]);

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    /**
     * Updates message status in persistent storage and dispatches sync
     */
    const updateMessageStatusLocally = (id: string, status: MessageStatus) => {
        const all = JSON.parse(localStorage.getItem('at_creator_messages_v4') || '[]');
        const updatedAll = all.map((m: any) => m.id === id ? { ...m, status } : m);
        localStorage.setItem('at_creator_messages_v4', JSON.stringify(updatedAll));
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    };

    const handleSend = async () => {
        if (!inputText.trim() || !user || isSending || !convId) return;
        
        if (!isOwnChannel && settings.slowModeSeconds > 0) {
            const lastMsg = messages.filter(m => m.sender_id === user.id).pop();
            if (lastMsg) {
                const diff = (Date.now() - new Date(lastMsg.created_at).getTime()) / 1000;
                if (diff < settings.slowModeSeconds) {
                    alert(`Slow Mode: Wait ${Math.ceil(settings.slowModeSeconds - diff)}s.`);
                    return;
                }
            }
        }

        setIsSending(true);
        const content = inputText;
        const msgId = `msg_${Date.now()}`;
        setInputText('');

        const moderation = await moderateContent(content);
        
        const newMsg: CreatorMessage = {
            id: msgId,
            conversation_id: convId,
            sender_id: user.id,
            content: moderation.isSafe ? content : "[RESTRICTED SIGNAL]",
            message_type: 'text',
            status: 'pending', // Initial Spinner
            created_at: new Date().toISOString(),
            is_paid: !isOwnChannel && settings.paidMessagePrice > 0,
            amount: settings.paidMessagePrice,
            profiles: profile as any
        };

        saveCreatorMessage(newMsg);
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();

        // Realistic Network Simulation for Ticks
        if (moderation.isSafe) {
            await new Promise(r => setTimeout(r, 600));
            updateMessageStatusLocally(msgId, 'sent'); // (✓) White

            await new Promise(r => setTimeout(r, 1000));
            updateMessageStatusLocally(msgId, 'delivered'); // (✓✓) Grey

            await new Promise(r => setTimeout(r, 1500));
            updateMessageStatusLocally(msgId, 'read'); // (✓✓) Blue Seen
        } else {
            updateMessageStatusLocally(msgId, 'flagged');
        }

        setIsSending(false);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        setDragStartX(e.touches[0].clientX);
        setIsDragging(true);
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - dragStartX;
        if (diff > 0) setOffsetX(diff);
    };
    const onTouchEnd = () => {
        setIsDragging(false);
        if (offsetX > 150) onClose();
        else setOffsetX(0);
    };

    const handleSelectConv = (conv: any) => {
        setSelectedConv(conv);
        setView('chat');
    };

    const StatusIndicator = ({ status }: { status: MessageStatus }) => {
        switch (status) {
            case 'pending': 
                return <Loader2 size={10} className="text-slate-500 animate-spin" />;
            case 'sent': 
                return <Check size={14} className="text-white animate-in zoom-in duration-300" strokeWidth={3} />;
            case 'delivered': 
                return <CheckCheck size={14} className="text-slate-500/80 animate-in fade-in duration-300" strokeWidth={3} />;
            case 'read': 
                return (
                    <div className="flex items-center gap-1 animate-in zoom-in-95 duration-500">
                        <CheckCheck size={14} className="text-[#34B7F1]" strokeWidth={3} />
                        <span className="text-[7px] font-black uppercase text-[#34B7F1] tracking-tighter">Seen</span>
                    </div>
                );
            case 'flagged': 
                return <ShieldAlert size={12} className="text-red-500 animate-pulse" />;
            default: 
                return null;
        }
    };

    return (
        <div 
            className="fixed inset-y-0 right-0 z-[500] w-full max-w-[500px] bg-[#020617] border-l border-white/10 shadow-[-20px_0_100px_rgba(0,0,0,0.9)] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden"
            style={{ transform: `translateX(${offsetX}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease-out' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent pointer-events-none" />

            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    {view === 'chat' && isOwnChannel ? (
                        <button onClick={() => setView('list')} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                            <ArrowLeft size={22} />
                        </button>
                    ) : null}
                    
                    <div className="relative">
                        <img 
                            src={view === 'chat' ? (isOwnChannel ? selectedConv?.fan?.avatar_url : creator.avatar_url) : creator.avatar_url} 
                            className="w-12 h-12 rounded-[1.25rem] object-cover ring-2 ring-brand/30 shadow-2xl" 
                        />
                        <div className="absolute -bottom-1 -right-1 bg-brand w-4 h-4 rounded-full border-2 border-[#020617] shadow-glow-brand animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase text-sm tracking-tight italic flex items-center gap-2">
                            {view === 'chat' ? (isOwnChannel ? selectedConv?.fan?.username : creator.username) : "Node Messaging Hub"} 
                            {view === 'chat' && <Zap size={12} className="text-brand fill-brand" />}
                        </h3>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {view === 'list' ? `${conversations.length} SECURE PULSES DETECTED` : (isTyping ? 'Calibrating Neural Sync...' : 'Direct End-to-End Handshake')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isOwnChannel && view !== 'settings' && (
                        <button 
                            onClick={() => setView('settings')}
                            className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl transition-all active:scale-90"
                        >
                            <Settings size={20} />
                        </button>
                    )}
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all active:scale-90 border border-white/5">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide relative z-10 flex flex-col">
                {view === 'list' ? (
                    <div className="flex-1 flex flex-col">
                        <div className="p-6">
                            <div className="relative group mb-8">
                                <div className="absolute inset-0 bg-brand/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand transition-colors" size={18} />
                                <input 
                                    placeholder="Filter neural signals..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-brand/40 transition-all placeholder-slate-700 shadow-inner relative z-10"
                                />
                            </div>
                            
                            <div className="space-y-3">
                                {conversations.map(conv => (
                                    <div 
                                        key={conv.id} 
                                        onClick={() => handleSelectConv(conv)}
                                        className="flex items-center gap-5 p-5 rounded-[2.5rem] hover:bg-white/5 transition-all cursor-pointer group relative border border-transparent hover:border-white/5 shadow-2xl active:scale-[0.98]"
                                    >
                                        <div className="relative shrink-0">
                                            <img src={conv.fan.avatar_url} className="w-16 h-16 rounded-[1.75rem] object-cover shadow-2xl group-hover:scale-105 transition-transform border border-white/5" />
                                            {conv.unread > 0 && (
                                                <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black min-w-[22px] h-[22px] flex items-center justify-center rounded-full border-2 border-[#020617] shadow-glow-brand animate-bounce">
                                                    {conv.unread}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <h4 className="font-black text-white text-[15px] uppercase tracking-tight truncate group-hover:text-brand transition-colors italic">
                                                    {conv.fan.username}
                                                </h4>
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-lg">
                                                    {new Date(conv.time).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className={`text-[13px] truncate ${conv.unread > 0 ? 'text-white font-bold' : 'text-slate-500 font-medium'}`}>
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            <ChevronRight size={20} className="text-slate-700" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : view === 'settings' ? (
                    <div className="p-6">
                        <button onClick={() => setView(isOwnChannel ? 'list' : 'chat')} className="flex items-center gap-2 text-brand font-black text-[10px] uppercase tracking-widest mb-8 hover:underline italic">
                            <ArrowLeft size={14} /> Back to Hub Node
                        </button>
                        <CreatorSettingsView creator={creator} settings={settings} onUpdate={(s) => { setSettings(s); saveCreatorSettings(creator.id, s); }} />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col p-6 space-y-8">
                        <div className="text-center py-10 opacity-30 flex flex-col items-center gap-3">
                            <div className="p-5 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-inner"><Lock size={28} className="text-slate-600" /></div>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] max-w-[250px] leading-relaxed text-center italic">SECURE P2P NEURAL HANDSHAKE V4.2 ACTIVE</p>
                        </div>

                        {messages.map((m) => {
                            const isMe = m.sender_id === user?.id;
                            const isFlagged = m.status === 'flagged';
                            return (
                                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[85%] px-6 py-4 rounded-[2.25rem] shadow-[0_15px_40px_rgba(0,0,0,0.5)] relative group overflow-hidden ${
                                        isMe 
                                        ? 'bg-brand text-white rounded-tr-none shadow-brand/10 border border-brand/20' 
                                        : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'
                                    } ${isFlagged ? 'border-red-500/40 bg-red-500/10' : ''}`}>
                                        {m.is_paid && !isMe && (
                                            <div className="flex items-center gap-2 mb-3 px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full w-fit border border-yellow-500/20">
                                                <Crown size={12} fill="currentColor" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Priority Node</span>
                                            </div>
                                        )}
                                        <p className={`text-[15px] font-semibold leading-relaxed tracking-tight ${isFlagged ? 'italic opacity-50' : ''}`}>{m.content}</p>
                                        
                                        {/* Status Row Below Message like WhatsApp */}
                                        <div className={`flex items-center gap-2 mt-2 px-1 ${isMe ? 'justify-end' : 'justify-start'} opacity-60`}>
                                            <span className="text-[8px] font-black uppercase tracking-widest italic">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            {isMe && !isFlagged && (
                                                <StatusIndicator status={m.status} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {isTyping && (
                            <div className="flex justify-start animate-in fade-in duration-300">
                                <div className="bg-white/5 px-7 py-3.5 rounded-full flex gap-1.5 items-center border border-white/5 shadow-inner">
                                    <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce shadow-glow-brand" />
                                    <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.2s] shadow-glow-brand" />
                                    <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.4s] shadow-glow-brand" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}
            </div>

            {/* Input Bar */}
            {view === 'chat' && (
                <div className="p-6 bg-black/60 border-t border-white/5 backdrop-blur-3xl relative z-20">
                    <div className="flex items-center gap-4">
                        <button className="p-3 text-slate-500 hover:text-brand transition-all hover:scale-110 active:scale-90"><Paperclip size={24}/></button>
                        <div className="flex-1 relative group">
                            <div className="absolute inset-0 bg-brand/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full"></div>
                            <input 
                                ref={inputRef}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Broadcast a thought..."
                                className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-5 text-sm font-semibold text-white outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all placeholder-slate-700 shadow-inner relative z-10"
                            />
                            <button className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-brand transition-colors z-10"><Smile size={22}/></button>
                        </div>
                        <button 
                            onClick={handleSend}
                            disabled={!inputText.trim() || isSending}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90 relative overflow-hidden ${inputText.trim() && !isSending ? 'bg-brand text-white shadow-brand/40 scale-105 active:shadow-inner' : 'bg-white/5 text-slate-800 opacity-30'}`}
                        >
                            {isSending ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <>
                                    <Send size={24} className="relative z-10" />
                                    {inputText.trim() && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent animate-pulse"></div>}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const CreatorSettingsView = ({ creator, settings, onUpdate }: { creator: Profile, settings: CreatorMessagingSettings, onUpdate: (s: CreatorMessagingSettings) => void }) => {
    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                    <Shield size={14} className="text-brand" /> ACCESS CONTROL PROTOCOLS
                </h4>
                <div className="space-y-2">
                    {[
                        { id: 'everyone', label: 'Global Node (Everyone)', icon: Globe },
                        { id: 'subscribers', label: 'Subscribers Only', icon: Users },
                        { id: 'paid_members', label: 'Neural Elite Only', icon: Crown }
                    ].map(opt => (
                        <button 
                            key={opt.id}
                            onClick={() => onUpdate({ ...settings, allowFrom: opt.id as any })}
                            className={`w-full flex items-center justify-between p-6 rounded-[2rem] border transition-all ${settings.allowFrom === opt.id ? 'bg-brand/10 border-brand/30 text-white shadow-xl' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'}`}
                        >
                            <div className="flex items-center gap-4">
                                <opt.icon size={22} />
                                <span className="text-[13px] font-black uppercase tracking-tight italic">{opt.label}</span>
                            </div>
                            {settings.allowFrom === opt.id && <CheckCircle2 size={20} className="text-brand shadow-[0_0_10px_brand]" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                    <Zap size={14} className="text-yellow-500" /> VELOCITY & AUTOMATION
                </h4>
                <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 space-y-10 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[15px] font-black uppercase text-white tracking-tight italic">Neural Bot Response</p>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Maintain identity when offline</p>
                        </div>
                        <button 
                            onClick={() => onUpdate({ ...settings, autoReplyEnabled: !settings.autoReplyEnabled })}
                            className={`w-14 h-7 rounded-full relative p-1 transition-all ${settings.autoReplyEnabled ? 'bg-brand shadow-[0_0_15px_brand]' : 'bg-slate-800'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white transition-all ${settings.autoReplyEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    {settings.autoReplyEnabled && (
                        <textarea 
                            value={settings.autoReplyText}
                            onChange={e => onUpdate({ ...settings, autoReplyText: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-[13px] font-medium text-slate-300 outline-none focus:border-brand h-28 resize-none italic shadow-inner tracking-tight"
                        />
                    )}

                    <div className="h-px bg-white/5" />

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[15px] font-black uppercase text-white tracking-tight italic">Node Monetization</p>
                            <p className="text-[9px] text-yellow-500 uppercase tracking-widest mt-1 italic">Monetize inbound thought streams</p>
                        </div>
                        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-5 py-3 shadow-inner ring-1 ring-white/5 focus-within:ring-brand/40 transition-all">
                            <span className="text-slate-500 font-black">$</span>
                            <input 
                                type="number"
                                value={settings.paidMessagePrice}
                                onChange={e => onUpdate({ ...settings, paidMessagePrice: Number(e.target.value) })}
                                className="bg-transparent text-white font-black w-14 text-center outline-none text-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] group hover:bg-red-500/10 transition-all cursor-pointer flex items-center justify-between shadow-2xl active:scale-[0.98]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-2xl"><UserX size={24} className="text-red-500" /></div>
                    <div>
                        <span className="text-[14px] font-black uppercase text-slate-400 group-hover:text-white transition-colors italic">Neural Quarantine</span>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">Manage blocked signal sources</p>
                    </div>
                </div>
                <ChevronRight size={22} className="text-slate-800 group-hover:text-white transition-colors" />
            </div>
        </div>
    );
};

export default CreatorChatPanel;
