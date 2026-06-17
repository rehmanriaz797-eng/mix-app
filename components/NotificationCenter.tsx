
import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { SmartNotification, NotificationMood, UserGlowSettings } from '../types';
import { 
    X, Sparkles, Zap, Coffee, Target, Users, 
    Flame, MapPin, Play, BellOff, Settings2, ChevronRight, 
    Trash2, Radio, Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOOD_MAP: Record<NotificationMood | 'all' | 'learn', any> = {
    all: { icon: Sparkles, label: 'ALL', color: 'text-brand', bg: 'bg-brand/10' },
    chill: { icon: Coffee, label: 'CHILL', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    learn: { icon: Brain, label: 'LEARN', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    energetic: { icon: Zap, label: 'ENERGY', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    urgent: { icon: Flame, label: 'URGENT', color: 'text-red-400', bg: 'bg-red-400/10' },
    curious: { icon: Target, label: 'CURIOUS', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    social: { icon: Users, label: 'SOCIAL', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
};

const TYPE_ICONS: any = {
    mood_match: Coffee,
    trending_near: MapPin,
    daily_highlight: Sparkles,
    streak_risk: Flame,
    live_proximity: Radio,
    friend_activity: Users,
    ai_curated: Sparkles
};

interface NotificationCenterProps {
    onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const [notifs, setNotifs] = useState<SmartNotification[]>(notificationService.getNotifications());
    const [settings, setSettings] = useState<UserGlowSettings>(notificationService.getSettings());
    const [activeTab, setActiveTab] = useState<'all' | 'settings'>('all');
    const [activeMoodFilter, setActiveMoodFilter] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(notifs.length > 0 ? notifs[0].id : null);

    useEffect(() => {
        const unsubNotifs = notificationService.subscribe(setNotifs);
        const unsubSettings = notificationService.subscribeSettings(setSettings);
        
        notificationService.generateIntelligence();
        
        return () => {
            unsubNotifs();
            unsubSettings();
        };
    }, []);

    const handleAction = (n: SmartNotification) => {
        notificationService.markAsRead(n.id);
        const route = n.metadata?.route || (n.metadata?.videoId ? `/watch/${n.metadata.videoId}` : '/');
        navigate(route);
        onClose();
    };

    const handleClear = () => {
        notificationService.clearAll();
    };

    const handleToggleQuietHours = (e: React.MouseEvent) => {
        e.stopPropagation();
        notificationService.toggleQuietHours();
    };

    const filteredNotifs = activeMoodFilter === 'all' 
        ? notifs 
        : notifs.filter(n => n.mood === activeMoodFilter || (activeMoodFilter === 'learn' && n.type === 'ai_curated'));

    return (
        <div className="fixed inset-0 md:inset-auto md:top-4 md:right-4 z-[100] w-full md:w-[480px] h-[100dvh] md:h-[calc(100vh-32px)] glass border border-white/10 rounded-none md:rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col font-sans">
            
            {/* Header Area */}
            <div className="pt-10 px-8 pb-6 bg-black/20 backdrop-blur-xl relative">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                           INTELLIGENCE
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI BRAIN SYNC ACTIVE</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setActiveTab(activeTab === 'all' ? 'settings' : 'all')}
                            className={`p-3 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'}`}
                        >
                            <Settings2 size={22} />
                        </button>
                        <button onClick={onClose} className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl border border-white/5 transition-all">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Mood Filter Pill Tabs */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {['all', 'chill', 'learn', 'energetic', 'urgent', 'curious'].map(m => {
                        const cfg = MOOD_MAP[m as keyof typeof MOOD_MAP];
                        const isActive = activeMoodFilter === m;
                        return (
                            <button 
                                key={m}
                                onClick={() => setActiveMoodFilter(m)}
                                className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 whitespace-nowrap ${isActive ? 'bg-brand text-white border-brand shadow-xl shadow-brand/20 scale-105' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                            >
                                <cfg.icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                                {cfg.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeTab === 'all' ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide pb-20">
                    {filteredNotifs.length === 0 ? (
                        <div className="py-32 text-center space-y-4 opacity-50">
                            <div className="p-8 bg-white/5 rounded-full inline-block animate-pulse"><BellOff size={48} /></div>
                            <p className="font-black uppercase tracking-widest text-sm text-slate-500">Awaiting Neural Signal...</p>
                        </div>
                    ) : (
                        filteredNotifs.map(n => {
                            const MoodConfig = MOOD_MAP[n.mood] || MOOD_MAP.chill;
                            const TypeIcon = TYPE_ICONS[n.type] || Sparkles;
                            const isExpanded = expandedId === n.id;

                            return (
                                <div 
                                    key={n.id}
                                    onClick={() => setExpandedId(isExpanded ? null : n.id)}
                                    className={`relative group rounded-[2.5rem] border transition-all duration-700 cursor-pointer overflow-hidden ${isExpanded ? 'bg-[#0f1530] border-brand/40 shadow-2xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                >
                                    {/* Critical Pulse Glow */}
                                    {n.isGlowActive && (
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-brand shadow-[0_0_25px_rgba(99,102,241,1)] animate-pulse"></div>
                                    )}

                                    <div className="p-8">
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${MoodConfig.bg} ${MoodConfig.color} ring-1 ring-white/10`}>
                                                    <TypeIcon size={20} />
                                                </div>
                                                <span className={`text-[11px] font-black uppercase tracking-[0.25em] ${MoodConfig.color}`}>{n.type.replace('_', ' ')}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        
                                        <h3 className="text-white font-black text-xl mb-3 tracking-tight leading-tight">{n.title}</h3>
                                        <p className="text-slate-400 text-[15px] font-medium leading-relaxed mb-6 opacity-80">{n.message}</p>
                                        
                                        {isExpanded && (
                                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                                {n.metadata?.previewUrl && (
                                                    <div className="aspect-video rounded-[1.5rem] overflow-hidden bg-black ring-1 ring-white/10 relative group/preview">
                                                        <img src={n.metadata.previewUrl} className="w-full h-full object-cover opacity-60 group-hover/preview:scale-110 transition-transform duration-[2000ms]" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="p-5 bg-brand rounded-full shadow-2xl shadow-brand/40 group-hover/preview:scale-125 transition-transform"><Play size={28} fill="white" className="ml-1" /></div>
                                                        </div>
                                                        {n.metadata.probabilityScore > 0.9 && (
                                                            <div className="absolute top-4 right-4 px-3 py-1 bg-brand text-white font-black text-[9px] rounded-full uppercase tracking-widest">PROBABILITY: 99%</div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleAction(n); }}
                                                        className="flex-1 py-4 bg-brand text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-brand/30 hover:bg-brand-600 active:scale-95 transition-all"
                                                    >
                                                        ENGAGE NOW
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                                                        className="px-8 py-4 bg-white/5 text-slate-400 font-black rounded-2xl text-xs uppercase tracking-widest border border-white/5 hover:text-white hover:bg-white/10 transition-all"
                                                    >
                                                        LATER
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {!isExpanded && (
                                            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                                                <div className="flex -space-x-3">
                                                    {[1,2,3].map(i => <img key={i} src={`https://picsum.photos/seed/face${i}/50/50`} className="w-6 h-6 rounded-full border-2 border-[#0b1026] object-cover" />)}
                                                    <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-[#0b1026] flex items-center justify-center text-[8px] font-black text-slate-500">+12</div>
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-500 group-hover:text-brand transition-all">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Details</span>
                                                    <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {notifs.length > 0 && (
                        <button 
                            onClick={handleClear}
                            className="w-full py-8 text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-red-400 flex items-center justify-center gap-3 transition-colors group"
                        >
                            <Trash2 size={16} className="group-hover:scale-110 transition-transform" /> 
                            PURGE NEURAL SIGNALS
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                    <section className="space-y-6">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                           <Brain size={14} /> NEURAL PREFERENCES
                        </h4>
                        {/* Fix: Explicitly cast entries to ReactNode-compatible pair to fix unknown assignability error */}
                        {(Object.entries(settings.interestSliders) as [string, number][]).map(([key, val]) => (
                            <div key={key} className="space-y-3">
                                <div className="flex justify-between items-center text-[12px] font-black text-white uppercase tracking-tight">
                                    <span>{key} PRIORITY</span>
                                    <span className="text-brand">{val}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden cursor-pointer group relative">
                                    <div 
                                        className="h-full bg-brand transition-all group-hover:shadow-[0_0_15px_rgba(99,102,241,0.6)]" 
                                        style={{ width: `${val}%` }}
                                        onClick={(e) => {
                                            const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                                            if (rect) {
                                                const newX = ((e.clientX - rect.left) / rect.width) * 100;
                                                notificationService.updateSlider(key, Math.round(newX));
                                            }
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className="space-y-6">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">SYSTEM PROTOCOLS</h4>
                        <div 
                            onClick={handleToggleQuietHours}
                            className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:border-brand/30 transition-all cursor-pointer select-none"
                        >
                            <div>
                                <h5 className="text-[13px] font-black text-white uppercase tracking-tight">QUIET HOURS AI</h5>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Auto-suppress irrelevant signals</p>
                            </div>
                            <div className={`w-14 h-7 rounded-full relative p-1 transition-all duration-500 ${settings.quietHoursActive ? 'bg-brand shadow-lg shadow-brand/20' : 'bg-slate-800'}`}>
                                <div className={`w-5 h-5 rounded-full transition-all duration-500 transform ${settings.quietHoursActive ? 'translate-x-7 bg-white' : 'translate-x-0 bg-slate-500'}`}></div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
            
            {/* Unified Bottom Progress Bar */}
            <div className="p-8 bg-black/40 border-t border-white/5 text-center flex flex-col items-center gap-4">
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden max-w-[200px]">
                     <div className="h-full bg-brand animate-pulse" style={{ width: `${settings.glowLevel}%` }}></div>
                 </div>
                 <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">NEURAL INTERFACE v2.05-BETA</p>
            </div>
        </div>
    );
};

export default NotificationCenter;
