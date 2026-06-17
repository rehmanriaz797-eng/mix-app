import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSortFeed } from './services/geminiService';
import { 
    toggleLikeShort, isShortLiked, getShortMetadata,
    toggleDislikeVideo, isVideoDisliked,
    fetchShortComments, postShortComment, toggleLikeComment, isCommentLiked,
    INITIAL_SHORTS, getPlaylists, toggleVideoInPlaylist, createPlaylist,
    addToHistory, toggleLikeVideo
} from './services/storageService';
import { useAuth } from './hooks/useAuth';
import { SortShort, ShortComment, Playlist } from './types';
import { 
    Heart, MessageSquare, Share2, LayoutGrid, Sparkles, 
    Zap, Send, X, Heart as HeartIcon, ThumbsDown,
    Play, Pause, ChevronDown, Bookmark, Music, CheckCircle2,
    MoreVertical, Clipboard, Volume2, VolumeX,
    AlignLeft, Sun, Captions, MinusCircle, Flag, 
    MessageSquareWarning, ChevronRight, Plus, Lock, Globe,
    Calendar, Eye, ThumbsUp, Check, Languages,
    FastForward, Rewind, ChevronLeft, ChevronsRight, ChevronsLeft
} from 'lucide-react';
import SubscribeAction from './components/SubscribeAction';
import FloatingOverlay from './components/FloatingOverlay';

const SMART_REPLIES = ["W", "OMG 😱", "PURE ART", "PART 2?", "VIBE"];

const SortFeed: React.FC = () => {
    const { id: deepLinkId } = useParams<{ id?: string }>();
    const [shorts, setShorts] = useState<SortShort[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [activeCommentShortId, setActiveCommentShortId] = useState<string | null>(null);
    const [showShareToast, setShowShareToast] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    
    const [moreMenuShortId, setMoreMenuShortId] = useState<string | null>(null);
    const [saveToShortId, setSaveToShortId] = useState<string | null>(null);
    const [descriptionShortId, setDescriptionShortId] = useState<string | null>(null);
    const [captionsShortId, setCaptionsShortId] = useState<string | null>(null);
    const [ambientMode, setAmbientMode] = useState(true);
    
    const [selectedCaption, setSelectedCaption] = useState('Off');
    const [playlistsVersion, setPlaylistsVersion] = useState(0);
    
    const navigate = useNavigate();

    const loadFeed = async (reset = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const data = await fetchSortFeed('for_you', shorts.map(s => s.id));
            if (data && data.length > 0) {
                const merged = data.map(s => {
                    const meta = getShortMetadata(s.id);
                    return meta ? { ...s, likes_count: meta.likes_count } : s;
                });
                
                setShorts(prev => {
                    let combined = reset ? merged : [...prev, ...merged];
                    if (reset && deepLinkId) {
                        const targetShort = INITIAL_SHORTS.find(s => s.id === deepLinkId);
                        if (targetShort) {
                            const filtered = combined.filter(s => s.id !== deepLinkId);
                            combined = [targetShort, ...filtered];
                        }
                    }
                    const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
                    return unique;
                });
            }
        } catch (e) {} finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadFeed(true); }, [deepLinkId]);

    const handleShareClick = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
    };

    const handlePlaylistUpdate = () => {
        setPlaylistsVersion(v => v + 1);
    };

    const currentShort = shorts[currentIndex];

    return (
        <div className={`fixed inset-0 bg-black z-[100] flex flex-col font-sans overflow-hidden select-none touch-none transition-all duration-1000 ${ambientMode ? 'shadow-[inset_0_0_100px_rgba(99,102,241,0.2)]' : ''}`}>
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent z-[90] flex items-center justify-between px-6 pointer-events-none">
                <button 
                    onClick={() => navigate('/')} 
                    className="pointer-events-auto text-white/80 p-2 hover:bg-white/10 rounded-2xl active:scale-90 transition-all"
                >
                    <LayoutGrid size={22} />
                </button>
                <div className="pointer-events-auto flex items-center gap-6 text-[11px] font-black tracking-[0.2em] text-white/50">
                    <button className="uppercase hover:text-white transition-colors">Following</button>
                    <button className="text-white border-b-2 border-brand pb-0.5 uppercase">For You</button>
                </div>
                <button 
                    onClick={() => setMoreMenuShortId(currentShort?.id || null)}
                    className="pointer-events-auto text-white/80 p-2 active:scale-90 transition-all hover:bg-white/10 rounded-full"
                >
                    <MoreVertical size={22} />
                </button>
            </div>

            <div className="flex-1 w-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide bg-black overscroll-none scroll-smooth touch-pan-y">
                {shorts.map((short, idx) => (
                    <ShortItem 
                        key={`${short.id}-${idx}`} 
                        short={short} 
                        isActive={currentIndex === idx}
                        isMuted={isMuted}
                        playlistsVersion={playlistsVersion}
                        onCommentClick={() => setActiveCommentShortId(short.id)}
                        onSaveClick={() => setSaveToShortId(short.id)}
                        onShareClick={handleShareClick}
                        onToggleMute={() => setIsMuted(!isMuted)}
                        onVisible={() => {
                            setCurrentIndex(idx);
                            if (idx >= shorts.length - 2) loadFeed();
                        }}
                    />
                ))}
            </div>

            {moreMenuShortId && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setMoreMenuShortId(null)}></div>
                    <div className="relative w-full max-w-[280px] bg-[#1c1c1c] rounded-[1.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/5 py-2 animate-in zoom-in-95 duration-200">
                        <MenuItem icon={AlignLeft} label="Description" onClick={() => { setDescriptionShortId(moreMenuShortId); setMoreMenuShortId(null); }} />
                        <MenuItem icon={Bookmark} label="Save to playlist" onClick={() => { setSaveToShortId(moreMenuShortId); setMoreMenuShortId(null); }} />
                        <MenuItem icon={Sun} label="Ambient mode" hasToggle checked={ambientMode} onToggle={() => setAmbientMode(!ambientMode)} />
                        <MenuItem icon={Captions} label="Captions" badge={selectedCaption} hasArrow onClick={() => { setCaptionsShortId(moreMenuShortId); setMoreMenuShortId(null); }} />
                        <MenuItem icon={MinusCircle} label="Don't recommend this channel" />
                        <MenuItem icon={Flag} label="Report" />
                        <MenuItem icon={MessageSquareWarning} label="Send feedback" />
                    </div>
                </div>
            )}

            {descriptionShortId && <DescriptionDrawer short={shorts.find(s => s.id === descriptionShortId)!} onClose={() => setDescriptionShortId(null)} />}
            {captionsShortId && <CaptionsDrawer selected={selectedCaption} onSelect={(val) => { setSelectedCaption(val); setCaptionsShortId(null); }} onClose={() => setCaptionsShortId(null)} />}
            {saveToShortId && <SaveToDialog shortId={saveToShortId} onClose={() => setSaveToShortId(null)} onUpdate={handlePlaylistUpdate} />}
            {activeCommentShortId && <CommentDrawer shortId={activeCommentShortId} onClose={() => setActiveCommentShortId(null)} creatorId={shorts.find(s => s.id === activeCommentShortId)?.user_id || ''} />}
            {showShareToast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-4"><Clipboard size={16} /> Link Copied</div>}
        </div>
    );
};

const CaptionsDrawer = ({ selected, onSelect, onClose }: { selected: string, onSelect: (val: string) => void, onClose: () => void }) => {
    const options = [
        { label: 'Off', icon: null },
        { label: 'Hindi (auto-generated)', icon: Sparkles },
        { label: 'Auto-translate', icon: Languages }
    ];

    return (
        <div className="fixed inset-0 z-[210] flex items-end justify-center animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-[#141414] rounded-t-[2.5rem] flex flex-col shadow-[0_-30px_100px_rgba(0,0,0,1)] border-t border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-400">
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2"></div>
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/5">
                    <h2 className="text-[18px] font-black text-white tracking-widest italic uppercase">Captions</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60"><X size={24} /></button>
                </div>
                <div className="p-4 space-y-2 mb-8">
                    {options.map((opt) => {
                        const isSelected = selected === opt.label;
                        return (
                            <button key={opt.label} onClick={() => onSelect(opt.label)} className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all duration-300 group ${isSelected ? 'bg-brand/10 border border-brand/20 shadow-xl' : 'hover:bg-white/5 border border-transparent'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-brand text-white' : 'bg-white/5 text-slate-500'}`}>{isSelected ? <Check size={20} strokeWidth={3} /> : opt.icon ? <opt.icon size={20} /> : <Captions size={20} />}</div>
                                <div className="flex-1 text-left">
                                    <span className={`text-[15px] font-black italic uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{opt.label}</span>
                                    {opt.label.includes('auto') && <div className="text-[9px] font-black text-brand/60 uppercase tracking-widest mt-0.5">Neural Engine Processing</div>}
                                </div>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_10px_rgba(99,102,241,1)] animate-pulse"></div>}
                            </button>
                        );
                    })}
                </div>
                <div className="p-8 bg-black/40 border-t border-white/5 text-center"><p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">Sub-Neural Translation v2.1</p></div>
            </div>
        </div>
    );
};

const DescriptionDrawer = ({ short, onClose }: { short: SortShort, onClose: () => void }) => {
    const views = (short.likes_count * 4.2).toLocaleString(undefined, { maximumFractionDigits: 0 });
    const formattedDate = new Date(short.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <div className="fixed inset-0 z-[210] flex items-end justify-center animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-[#141414] rounded-t-[2.5rem] flex flex-col h-[70vh] shadow-[0_-30px_100px_rgba(0,0,0,1)] border-t border-white/10 overflow-hidden animate-in slide-in-from-bottom duration-500">
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2"></div>
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/5">
                    <h2 className="text-[18px] font-black text-white tracking-widest italic uppercase">Description</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10 scrollbar-hide pb-32">
                    <h1 className="text-2xl font-black text-white leading-tight italic tracking-tight">{short.title} 🔥</h1>
                    <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-8">
                        <div className="text-center group"><div className="flex flex-col items-center gap-1.5 mb-1 text-white"><span className="font-black text-2xl">{short.likes_count.toLocaleString()}</span></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-brand transition-colors">Likes</span></div>
                        <div className="text-center group"><div className="flex flex-col items-center gap-1.5 mb-1 text-white"><span className="font-black text-2xl">{views}</span></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-brand transition-colors">Views</span></div>
                        <div className="text-center group"><div className="flex flex-col items-center gap-1.5 mb-1 text-white"><span className="font-black text-2xl">{formattedDate.split(',')[0]}</span></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-brand transition-colors">{formattedDate.split(',')[1]?.trim() || '2025'}</span></div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"><Sparkles size={100} /></div>
                        <p className="text-[16px] text-slate-200 leading-relaxed font-medium italic whitespace-pre-wrap">{short.caption}</p>
                        <div className="mt-8 flex flex-wrap gap-2.5">{short.tags?.map(t => (<span key={t} className="text-[10px] font-black text-brand bg-brand/10 border border-brand/20 px-3 py-1.5 rounded-xl uppercase tracking-widest">#{t}</span>))}</div>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <img src={short.profiles.avatar_url} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand/20" />
                            <div>
                                <div className="text-[14px] font-black text-white italic tracking-tight flex items-center gap-1.5">@{short.profiles.username}<CheckCircle2 size={14} className="text-brand" fill="currentColor" /></div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Node</div>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-600" />
                    </div>
                </div>
                <div className="p-8 bg-black/40 border-t border-white/5 text-center"><p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">Neural Insight Protocol v4.2</p></div>
            </div>
        </div>
    );
};

const SaveToDialog = ({ shortId, onClose, onUpdate }: { shortId: string, onClose: () => void, onUpdate: () => void }) => {
    const [mode, setMode] = useState<'list' | 'create'>('list');
    const [playlists, setPlaylists] = useState<Playlist[]>(getPlaylists());
    const [newName, setNewName] = useState('');
    const [visibility, setVisibility] = useState<'Public' | 'Private' | 'Unlisted'>('Private');
    const [isCollaborate, setIsCollaborate] = useState(false);
    const [showVisibilityOptions, setShowVisibilityOptions] = useState(false);

    useEffect(() => {
        const current = getPlaylists();
        if (current.length === 0) {
            ['Watch later', 'Sounds from Shorts', 'Funny Shorts'].forEach((title) => createPlaylist(title));
            setPlaylists(getPlaylists());
        }
    }, []);

    const handleToggle = (pid: string, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        toggleVideoInPlaylist(pid, shortId);
        setPlaylists(getPlaylists());
        onUpdate();
        if (navigator.vibrate) navigator.vibrate(10);
    };

    const handleCreate = () => {
        if (!newName.trim()) return;
        createPlaylist(newName, shortId);
        setPlaylists(getPlaylists());
        onUpdate();
        setNewName('');
        setMode('list');
        if (navigator.vibrate) navigator.vibrate(15);
    };

    if (mode === 'create') {
        return (
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
                <div className="relative w-full max-w-[340px] bg-[#1c1c1c] rounded-[1.5rem] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] border border-white/5 animate-in zoom-in-95 duration-200 flex flex-col p-6">
                    <h2 className="text-[18px] font-black text-white tracking-tight italic uppercase mb-8">New playlist</h2>
                    <div className="space-y-6">
                        <div className="relative group"><input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Choose a title" className="w-full bg-transparent border-b border-white/20 px-0 py-2.5 text-[15px] text-white outline-none focus:border-brand transition-colors font-medium placeholder-white/20" /><div className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand transition-all duration-300 group-focus-within:w-full"></div></div>
                        <div className="relative">
                            <label className="text-[11px] font-black text-white/40 uppercase tracking-widest block mb-2">Visibility</label>
                            <button onClick={() => setShowVisibilityOptions(!showVisibilityOptions)} className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-all border border-white/5"><div className="flex items-center gap-3">{visibility === 'Private' ? <Lock size={16} className="text-white/60" /> : <Globe size={16} className="text-white/60" />}<span className="text-[14px] font-bold text-white">{visibility}</span></div><ChevronDown size={18} className={`text-white/40 transition-transform ${showVisibilityOptions ? 'rotate-180' : ''}`} /></button>
                            {showVisibilityOptions && (<div className="absolute top-full left-0 right-0 mt-2 bg-[#2a2a2a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 animate-in slide-in-from-top-2">{['Public', 'Private', 'Unlisted'].map(v => (<button key={v} onClick={() => { setVisibility(v as any); setShowVisibilityOptions(false); }} className="w-full text-left px-4 py-3 text-[13px] font-bold text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">{v}</button>))}</div>)}
                        </div>
                        <div className="flex items-center justify-between py-2"><span className="text-[14px] font-bold text-white italic tracking-tight">Collaborate</span><button onClick={() => setIsCollaborate(!isCollaborate)} className={`w-11 h-6 rounded-full relative transition-all duration-300 ${isCollaborate ? 'bg-brand' : 'bg-white/10'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${isCollaborate ? 'left-6' : 'left-1'}`} /></button></div>
                    </div>
                    <div className="flex gap-3 mt-10"><button onClick={() => setMode('list')} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all">Cancel</button><button onClick={handleCreate} disabled={!newName.trim()} className="flex-1 py-3.5 bg-brand text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-brand/20 disabled:opacity-30 disabled:shadow-none">Create</button></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-[320px] bg-[#1c1c1c] rounded-[1rem] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] border border-white/5 animate-in zoom-in-95 duration-200 flex flex-col">
                <div className="px-6 py-5 flex items-center justify-between border-b border-white/5"><h2 className="text-[15px] font-black text-white tracking-widest italic uppercase">SAVE TO...</h2><button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors"><X size={20} className="text-white/80" /></button></div>
                <div className="max-h-[350px] overflow-y-auto py-2 scrollbar-hide">{playlists.map(p => { const inPlaylist = (p.video_ids || []).includes(shortId); return (<div key={p.id} onClick={(e) => handleToggle(p.id, e)} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer group"><div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0"><LayoutGrid size={20} className="text-white/30" /></div><div className="flex-1 min-w-0"><div className="text-[14px] font-bold text-white leading-tight mb-1">{p.title}</div><div className="text-[10px] text-white/40 flex items-center gap-1.5 font-black uppercase tracking-widest"><Lock size={10} /> PRIVATE</div></div><Bookmark size={20} className={`transition-all ${inPlaylist ? 'text-brand fill-brand' : 'text-white/60'}`} strokeWidth={2.5} /></div>); })}</div>
                <div className="p-4 border-t border-white/5 bg-[#1c1c1c]"><button onClick={() => setMode('create')} className="w-full py-4 flex items-center justify-center gap-3 hover:bg-white/5 active:scale-95 transition-all text-white font-black text-[11px] uppercase tracking-[0.2em]"><Plus size={18} className="text-brand" /> NEW PLAYLIST</button></div>
            </div>
        </div>
    );
};

const MenuItem = ({ icon: Icon, label, hasToggle, checked, onToggle, badge, hasArrow, onClick }: any) => (
    <button onClick={(e) => { if (onClick) onClick(e); else if (hasToggle && onToggle) onToggle(e); }} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors text-left group">
        <Icon size={20} className="text-white shrink-0 opacity-90 group-hover:opacity-100" /><span className="flex-1 text-[13px] text-[#f1f1f1] font-medium leading-tight">{label}</span>
        {hasToggle && (<div className={`w-[34px] h-[18px] rounded-full relative transition-all duration-300 border ${checked ? 'bg-[#3ea6ff]' : 'bg-[#717171]'}`}><div className={`absolute top-[1px] w-3.5 h-3.5 rounded-full bg-white transition-all shadow-md ${checked ? 'left-[17px]' : 'left-[1px]'}`} /></div>)}
        {badge && <span className="text-[12px] text-brand/80 font-black uppercase tracking-widest">{badge}</span>}{hasArrow && <ChevronRight size={16} className="text-white/50" />}
    </button>
);

const ShortItem: React.FC<{ 
    short: SortShort; 
    isActive: boolean; 
    isMuted: boolean; 
    playlistsVersion: number;
    onVisible: () => void; 
    onCommentClick: () => void; 
    onSaveClick: () => void;
    onShareClick: () => void;
    onToggleMute: () => void;
}> = ({ short, isActive, isMuted, playlistsVersion, onVisible, onCommentClick, onSaveClick, onShareClick, onToggleMute }) => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const playPromiseRef = useRef<Promise<void> | null>(null);
    
    const [isLiked, setIsLiked] = useState(isShortLiked(short.id));
    const [isDisliked, setIsDisliked] = useState(isVideoDisliked(short.id));
    const [isDislikeAnimating, setIsDislikeAnimating] = useState(false);
    const [likesCount, setLikesCount] = useState(short.likes_count);
    const [reactions, setReactions] = useState<{id: number, x: number, y: number}[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverInfo, setHoverInfo] = useState<{ time: number, x: number } | null>(null);

    const [showPlayPauseIndicator, setShowPlayPauseIndicator] = useState(false);
    const [seekFeedback, setSeekFeedback] = useState<'forward' | 'backward' | null>(null);
    const [cumulativeSkip, setCumulativeSkip] = useState(0);

    const isActuallySaved = useMemo(() => {
        const playlists = getPlaylists();
        return playlists.some(p => (p.video_ids || []).includes(short.id));
    }, [playlistsVersion, short.id]);
    
    const lastTap = useRef(0);
    const clickTimeout = useRef<number | null>(null);
    const skipResetTimer = useRef<number | null>(null);

    const formatTime = (time: number) => {
        if (!isFinite(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleSeek = (clientX: number) => {
        const v = videoRef.current;
        if (!v || !progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        const total = v.duration;
        if (isFinite(total)) {
            const newTime = percentage * total;
            v.currentTime = newTime;
            setProgress(percentage * 100);
        }
    };

    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleSeek(e.clientX);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        const v = videoRef.current;
        if (!progressBarRef.current || !v || !isFinite(v.duration)) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        const time = percentage * v.duration;
        setHoverInfo({ time, x: e.clientX - rect.left });
        
        if (isDragging) {
            handleSeek(e.clientX);
        }
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) onVisible();
        }, { threshold: 0.6 });
        if (observerRef.current) observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [onVisible]);

    const safePlay = async () => {
        if (!videoRef.current) return;
        try {
            playPromiseRef.current = videoRef.current.play();
            await playPromiseRef.current;
            playPromiseRef.current = null;
            setIsPaused(false);
        } catch {
            playPromiseRef.current = null;
        }
    };

    const safePause = async () => {
        if (!videoRef.current) return;
        if (playPromiseRef.current) {
            try { await playPromiseRef.current; } catch {}
        }
        videoRef.current.pause();
        setIsPaused(true);
    };

    useEffect(() => {
        if (isActive && videoRef.current) {
            safePlay();
            addToHistory(short);
        } else if (videoRef.current) {
            safePause();
        }
    }, [isActive, short]);

    const handleTimeUpdate = () => {
        const v = videoRef.current;
        if (v && !isDragging) {
            const current = v.currentTime;
            const duration = v.duration;
            if (isFinite(duration) && duration > 0) setProgress((current / duration) * 100);
        }
    };

    const handleLikeToggle = () => {
        // Fix: Pass short.id instead of short object to match toggleLikeVideo signature
        const nowLiked = toggleLikeVideo(short.id);
        setIsLiked(nowLiked);
        setLikesCount(prev => nowLiked ? prev + 1 : Math.max(0, prev - 1));
        if (nowLiked && isDisliked) {
            toggleDislikeVideo(short.id);
            setIsDisliked(false);
        }
        if (navigator.vibrate) navigator.vibrate(15);
    };

    const handleDislikeToggle = () => {
        const nowDisliked = toggleDislikeVideo(short.id);
        setIsDisliked(nowDisliked);
        if (nowDisliked) {
            setIsDislikeAnimating(true);
            setTimeout(() => setIsDislikeAnimating(false), 500);
            if (isLiked) {
                // Fix: Pass short.id instead of short object to match toggleLikeVideo signature
                toggleLikeVideo(short.id);
                setIsLiked(false);
                setLikesCount(prev => Math.max(0, prev - 1));
            }
        }
        if (navigator.vibrate) navigator.vibrate(15);
    };

    const triggerSeekFeedback = (dir: 'forward' | 'backward') => {
        setSeekFeedback(dir);
        setCumulativeSkip(prev => prev + 5);
        
        if (skipResetTimer.current) window.clearTimeout(skipResetTimer.current);
        skipResetTimer.current = window.setTimeout(() => {
            setSeekFeedback(null);
            setCumulativeSkip(0);
        }, 1000);
    };

    const handleVideoClick = (e: React.MouseEvent) => {
        const now = Date.now();
        const delta = now - lastTap.current;
        lastTap.current = now;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        // Cumulative rapid tap check
        const isRapidTap = delta < 300 || (seekFeedback !== null && delta < 600);

        if (isRapidTap) {
            if (clickTimeout.current) {
                window.clearTimeout(clickTimeout.current);
                clickTimeout.current = null;
            }

            const v = videoRef.current;
            if (!v || !isFinite(v.duration)) return;

            if (clickX < width * 0.4) {
                v.currentTime = Math.max(0, v.currentTime - 5);
                triggerSeekFeedback('backward');
                if (navigator.vibrate) navigator.vibrate([15, 10]);
            } else if (clickX > width * 0.6) {
                v.currentTime = Math.min(v.duration, v.currentTime + 5);
                triggerSeekFeedback('forward');
                if (navigator.vibrate) navigator.vibrate([15, 10]);
            } else {
                if (!isLiked) handleLikeToggle();
                const newReaction = { id: Date.now(), x: e.clientX, y: e.clientY };
                setReactions(prev => [...prev, newReaction]);
                setTimeout(() => setReactions(prev => prev.filter(r => r.id !== newReaction.id)), 1000);
            }
        } else {
            clickTimeout.current = window.setTimeout(() => {
                const v = videoRef.current;
                if (v) {
                    if (v.paused) safePlay();
                    else safePause();
                    
                    setShowPlayPauseIndicator(true);
                    setTimeout(() => setShowPlayPauseIndicator(false), 800);
                }
                clickTimeout.current = null;
            }, 220);
        }
    };

    const channelName = short.profiles?.username || 'NeonSeeker';

    return (
        <div ref={observerRef} className="w-full h-full snap-start relative bg-black flex justify-center overflow-hidden">
            <div ref={containerRef} className="w-full h-full relative" onClick={handleVideoClick}>
                <video 
                    ref={videoRef}
                    src={short.video_url}
                    className="w-full h-full object-cover outline-none"
                    loop
                    muted={isMuted}
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                />

                {seekFeedback === 'backward' && (
                    <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center pointer-events-none z-[60] bg-gradient-to-r from-white/20 to-transparent">
                        <div className="flex flex-col items-center gap-5 animate-seek-ripple-left">
                            <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/15">
                                <ChevronsLeft size={52} className="text-white fill-white" />
                            </div>
                            <div className="flex flex-col items-center gap-1 drop-shadow-2xl">
                                <span className="text-white font-black text-2xl italic">-{cumulativeSkip}S</span>
                                <span className="text-white font-black text-[9px] tracking-[0.4em] opacity-80 uppercase">Rewind Protocol</span>
                            </div>
                        </div>
                    </div>
                )}
                {seekFeedback === 'forward' && (
                    <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center pointer-events-none z-[60] bg-gradient-to-l from-white/20 to-transparent">
                        <div className="flex flex-col items-center gap-5 animate-seek-ripple-right">
                            <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/15">
                                <ChevronsRight size={52} className="text-white fill-white" />
                            </div>
                            <div className="flex flex-col items-center gap-1 drop-shadow-2xl">
                                <span className="text-white font-black text-2xl italic">+{cumulativeSkip}S</span>
                                <span className="text-white font-black text-[9px] tracking-[0.4em] opacity-80 uppercase">Skip Transmission</span>
                            </div>
                        </div>
                    </div>
                )}

                {showPlayPauseIndicator && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[70]">
                        <div className="p-12 bg-black/20 backdrop-blur-sm rounded-full scale-pop-animation">
                            {isPaused ? <Pause size={80} className="text-white fill-white" /> : <Play size={80} className="text-white fill-white ml-2" />}
                        </div>
                    </div>
                )}

                {reactions.map(r => (
                    <div key={r.id} className="fixed pointer-events-none z-[80] animate-heart-burst" style={{ left: r.x - 40, top: r.y - 80 }}>
                        <HeartIcon size={100} className="text-red-500 fill-current drop-shadow-2xl" />
                    </div>
                ))}
            </div>

            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/95 via-transparent to-black/20 z-20" />

            <div className="absolute right-3.5 bottom-28 z-[100] flex flex-col items-center gap-5 pointer-events-auto">
                <ActionBtn icon={Heart} label={likesCount.toLocaleString()} active={isLiked} onClick={handleLikeToggle} activeColor="text-red-500" fill={isLiked} />
                <ActionBtn icon={ThumbsDown} label="DISLIKE" active={isDisliked} onClick={handleDislikeToggle} fill={isDisliked} className={isDislikeAnimating ? 'animate-dislike-drop' : ''} />
                <ActionBtn icon={MessageSquare} label={short.comments_count.toString()} onClick={onCommentClick} />
                <ActionBtn icon={Bookmark} label="SAVE" active={isActuallySaved} onClick={onSaveClick} fill={isActuallySaved} activeColor="text-brand" />
                <ActionBtn icon={Share2} label="SHARE" onClick={onShareClick} />
                <div onClick={(e) => { e.stopPropagation(); navigate('/channel'); }} className="w-11 h-11 rounded-full border-2 border-white/20 bg-slate-900 flex items-center justify-center animate-spin-slow shadow-xl overflow-hidden mt-1 p-0.5"><img src={short.profiles?.avatar_url} className="w-full h-full rounded-full object-cover" /></div>
            </div>

            <div className="absolute bottom-12 left-4 right-16 z-[100] pointer-events-none">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div onClick={(e) => { e.stopPropagation(); navigate('/channel'); }} className="pointer-events-auto flex items-center gap-2.5 bg-black/40 backdrop-blur-3xl px-2 py-1.5 pr-4 rounded-full border border-white/10 hover:bg-white/10 transition-all cursor-pointer group shadow-xl"><img src={short.profiles?.avatar_url} className="w-8 h-8 rounded-full object-cover border border-white/20" /><span className="text-[13px] font-black text-white italic tracking-tight flex items-center gap-1">@{channelName}<CheckCircle2 size={12} className="text-brand" fill="currentColor" /></span></div>
                        <SubscribeAction channelName={channelName} variant="shorts" />
                    </div>
                    <div className="space-y-2"><p className="text-[14px] font-bold text-white leading-tight drop-shadow-lg pr-4 line-clamp-2 italic">{short.caption}</p><div className="flex flex-wrap gap-2 pointer-events-auto">{short.tags?.map(t => (<button key={t} className="text-[9px] font-black text-white uppercase bg-white/10 border border-white/5 px-2.5 py-1.5 rounded-lg shadow-lg">#{t}</button>))}</div></div>
                    <div className="pointer-events-auto flex items-center gap-3 bg-black/40 backdrop-blur-2xl border border-white/10 px-4 py-2 rounded-xl w-fit marquee-container overflow-hidden max-w-[210px] shadow-xl"><Music size={12} className="text-white shrink-0" /><div className="overflow-hidden whitespace-nowrap"><p className="text-[10px] font-black text-white uppercase tracking-widest animate-marquee inline-block italic">{short.music_name} — {channelName} • ORIGINAL AUDIO • {short.music_name} — {channelName} • ORIGINAL AUDIO •</p></div></div>
                </div>
            </div>

            <div className="absolute top-28 right-4 z-[90]"><button onClick={(e) => { e.stopPropagation(); onToggleMute(); }} className="p-2.5 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl text-white active:scale-90 transition-all shadow-xl">{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button></div>

            <div ref={progressBarRef} className="absolute bottom-0 left-0 h-4 w-full z-[101] cursor-pointer group/seek flex items-end overflow-visible" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseLeave={() => setHoverInfo(null)}>
                {hoverInfo && (<div className="absolute bottom-10 px-3 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl text-[12px] font-black text-white pointer-events-none -translate-x-1/2 shadow-2xl animate-in fade-in slide-in-from-bottom-2" style={{ left: `${hoverInfo.x}px` }}>{formatTime(hoverInfo.time)}</div>)}
                <div className="w-full h-[3px] group-hover/seek:h-[6px] bg-white/10 transition-all duration-200 relative"><div className="h-full transition-none rounded-r-full relative" style={{ width: `${progress}%`, backgroundColor: '#7B5CFF', boxShadow: '0 0 15px rgba(123, 92, 255, 0.9)' }}><div className="absolute right-0 top-1/2 -translate-y-1/2 w-[12px] h-[12px] bg-white rounded-full scale-0 group-hover/seek:scale-100 transition-transform shadow-[0_0_15px_#7B5CFF]"></div></div></div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scale-pop-full {
                    0% { transform: scale(0.6); opacity: 0; }
                    20% { transform: scale(1.1); opacity: 1; }
                    80% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.2); opacity: 0; }
                }
                .scale-pop-animation {
                    animation: scale-pop-full 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                }

                @keyframes seek-ripple-left {
                    0% { transform: translateX(-40px) scale(0.8); opacity: 0; filter: blur(10px); }
                    30% { transform: translateX(-20px) scale(1.1); opacity: 1; filter: blur(0); }
                    100% { transform: translateX(-60px) scale(1.5); opacity: 0; filter: blur(25px); }
                }
                @keyframes seek-ripple-right {
                    0% { transform: translateX(40px) scale(0.8); opacity: 0; filter: blur(10px); }
                    30% { transform: translateX(20px) scale(1.1); opacity: 1; filter: blur(0); }
                    100% { transform: translateX(60px) scale(1.5); opacity: 0; filter: blur(25px); }
                }
                .animate-seek-ripple-left {
                    animation: seek-ripple-left 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-seek-ripple-right {
                    animation: seek-ripple-right 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}} />
        </div>
    );
};

const ActionBtn = ({ icon: Icon, label, active, onClick, activeColor = "", fill = false, className = "" }: any) => (
    <div className={`flex flex-col items-center gap-1.5 cursor-pointer group ${className}`} onClick={onClick}>
        <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 active:scale-75 ${active ? 'bg-white/15 shadow-glow-brand border border-white/20' : 'bg-black/40 backdrop-blur-3xl border border-white/5 hover:bg-white/5 shadow-lg'}`}><Icon size={26} className={`transition-all duration-300 ${active ? activeColor || 'text-white' : 'text-white'}`} fill={fill ? 'currentColor' : 'none'} strokeWidth={active ? 2.5 : 2} /></div>
        {label && <span className="text-[10px] font-black text-white drop-shadow-xl uppercase italic tracking-tighter">{label}</span>}
    </div>
);

const CommentDrawer: React.FC<{ shortId: string, onClose: () => void, creatorId: string }> = ({ shortId, onClose, creatorId }) => {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState<ShortComment[]>([]);
    const [inputText, setInputText] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const refreshComments = useCallback(async () => {
        const data = await fetchShortComments(shortId);
        setComments(data);
    }, [shortId]);

    useEffect(() => { refreshComments(); }, [refreshComments]);

    const handlePost = async () => {
        if (!inputText.trim() || !user || isPosting) return;
        setIsPosting(true);
        const temp = inputText;
        setInputText('');
        await postShortComment(shortId, user.id, temp, profile as any);
        await refreshComments();
        setIsPosting(false);
        if (navigator.vibrate) navigator.vibrate(10);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-end justify-center animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-[#0d0d0d] rounded-t-[3rem] flex flex-col h-[75vh] shadow-[0_-25px_120px_rgba(0,0,0,1)] border-t border-white/10 overflow-hidden">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-5 mb-2"></div>
                <div className="px-10 py-5 flex items-center justify-between border-b border-white/5"><h3 className="text-white font-black uppercase text-base italic tracking-widest">Discussion Hub <span className="text-brand ml-2">({comments.length})</span></h3><button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-white active:scale-90 transition-all border border-white/5"><X size={22}/></button></div>
                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 scrollbar-hide pb-32">{comments.map(c => (<div key={c.id} className="flex gap-5 group"><img src={c.profiles?.avatar_url} className="w-11 h-11 rounded-full bg-white/5 object-cover border border-white/10 shadow-lg" /><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1.5"><span className={`font-black text-[12px] uppercase tracking-tight ${c.user_id === creatorId ? 'text-brand' : 'text-slate-400'}`}>@{c.profiles?.username}</span><span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span></div><p className="text-[15px] font-medium leading-relaxed text-slate-200">{c.content}</p></div></div>))}</div>
                <div className="absolute bottom-0 inset-x-0 bg-black/95 backdrop-blur-3xl border-t border-white/5 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))] px-6 z-[130]"><div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5">{SMART_REPLIES.map(reply => (<button key={reply} onClick={() => setInputText(reply)} className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-black text-slate-400 hover:text-white transition-all whitespace-nowrap active:scale-95 uppercase tracking-widest">{reply}</button>))}</div><div className="flex items-center gap-4"><img src={profile?.avatar_url || 'https://picsum.photos/100'} className="w-11 h-11 rounded-full border border-white/10 shadow-2xl" /><div className="flex-1 relative"><input ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePost()} placeholder="Sync a thought..." className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-[14px] text-white outline-none focus:border-brand transition-all font-semibold shadow-inner" /><button onClick={handlePost} disabled={!inputText.trim()} className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all ${inputText.trim() ? 'bg-brand text-white scale-100 shadow-glow-brand' : 'bg-white/5 text-slate-600 scale-90 opacity-50'}`}><Send size={18} /></button></div></div></div>
            </div>
        </div>
    );
};

export default SortFeed;