
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Reel, SortShort } from '../types';
import { Heart, MessageCircle, Share2, MoreVertical, Music2, LayoutGrid, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FloatingOverlay from '../components/FloatingOverlay';
import { addToHistory } from '../services/storageService';

const Reels: React.FC = () => {
    const [reels, setReels] = useState<Reel[]>([]);
    const navigate = useNavigate();
    
    useEffect(() => {
        const fetchReels = async () => {
            const { data } = await supabase
                .from('reels')
                .select('*, profiles(username, avatar_url, is_verified)')
                .order('created_at', { ascending: false });
            if (data) setReels(data as any);
        };
        fetchReels();
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col font-sans overflow-hidden select-none">
            {/* Header Overlay - Compact */}
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/60 to-transparent z-[70] pointer-events-none flex items-center justify-between px-6">
                <button 
                    onClick={() => navigate('/')} 
                    className="pointer-events-auto text-white/90 p-2 hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                >
                    <LayoutGrid size={22} />
                </button>
                <div className="pointer-events-auto flex items-center gap-6 text-[10px] font-black tracking-[0.15em] text-white/50">
                    <button className="text-white border-b-2 border-brand pb-0.5 uppercase">Reels</button>
                    <button className="hover:text-white transition-colors uppercase">Explore</button>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 w-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide bg-black overscroll-none scroll-smooth">
                {reels.length === 0 && (
                    <div className="h-full flex items-center justify-center text-white/10 font-black uppercase tracking-widest text-[10px]">
                        Synchronizing...
                    </div>
                )}
                {reels.map((reel) => (
                    <ReelPlayer key={reel.id} reel={reel} />
                ))}
            </div>
        </div>
    );
};

const ReelPlayer: React.FC<{ reel: Reel }> = ({ reel }) => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const adaptedReel: SortShort = {
        id: reel.id,
        user_id: reel.user_id,
        title: reel.caption.split('\n')[0],
        caption: reel.caption,
        video_url: reel.video_url,
        thumbnail_url: reel.thumbnail_url || '',
        music_name: 'Original Audio',
        likes_count: reel.likes_count,
        comments_count: 0,
        share_count: 0,
        ai_score: 0.9,
        momentum_score: 1.1,
        duration_label: '0:30',
        tags: [],
        profiles: reel.profiles,
        created_at: reel.created_at
    };

    // Tracking history on mount (start of view)
    useEffect(() => {
        addToHistory(adaptedReel);
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(() => {
                    // Silently handle 'interrupted by pause' error
                });
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(Math.floor(videoRef.current.currentTime));
        }
    };

    return (
        <div className="w-full h-full snap-start relative bg-black flex justify-center overflow-hidden">
            <video 
                ref={videoRef}
                src={reel.video_url}
                className="w-full h-full object-cover cursor-pointer"
                loop
                autoPlay
                muted={false}
                playsInline
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
            />
            
            <FloatingOverlay short={adaptedReel} currentTime={currentTime} />

            {/* Sidebar Actions - Tucked into bottom-right for mobile ergonomics */}
            <div className="absolute right-3 bottom-24 z-[80] flex flex-col items-center gap-3 pointer-events-auto">
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setIsLiked(!isLiked)}>
                    <div className={`p-3 w-12 h-12 flex items-center justify-center rounded-full border transition-all active:scale-75 ${isLiked ? 'border-red-500/60 bg-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.5)]' : 'bg-black/20 backdrop-blur-3xl border-white/5'}`}>
                        <Heart size={22} className={`transition-all duration-300 ${isLiked ? 'text-red-500 fill-current' : 'text-white/90'}`} />
                    </div>
                    <span className="text-[9px] font-black text-white/70 drop-shadow-md uppercase tracking-tighter">{reel.likes_count}</span>
                </div>

                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => e.stopPropagation()}>
                    <div className={`p-3 w-12 h-12 flex items-center justify-center bg-black/20 backdrop-blur-3xl rounded-2xl border border-white/5 transition-all active:scale-75`}>
                        <MessageCircle size={22} className="text-white/90" />
                    </div>
                    <span className="text-[9px] font-black text-white/70 drop-shadow-md uppercase tracking-tighter">0</span>
                </div>

                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setIsSaved(!isSaved)}>
                    <div className={`p-3 w-12 h-12 flex items-center justify-center rounded-2xl border transition-all active:scale-75 ${isSaved ? 'border-brand/60 bg-brand/20' : 'bg-black/20 backdrop-blur-3xl border-white/5'}`}>
                        <Bookmark size={22} className={`transition-all duration-300 ${isSaved ? 'text-brand fill-current' : 'text-white/90'}`} />
                    </div>
                    <span className="text-[9px] font-black text-white/70 drop-shadow-md uppercase tracking-tighter">Save</span>
                </div>

                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => e.stopPropagation()}>
                    <div className={`p-3 w-12 h-12 flex items-center justify-center bg-black/20 backdrop-blur-3xl rounded-2xl border border-white/5 transition-all active:scale-75`}>
                        <Share2 size={22} className="text-white/90" />
                    </div>
                    <span className="text-[9px] font-black text-white/70 drop-shadow-md uppercase tracking-tighter">Share</span>
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/channel'); }}
                    className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center animate-spin-slow shadow-xl overflow-hidden p-0.5 mt-2 transition-transform active:scale-90"
                >
                    <img src={reel.profiles?.avatar_url || 'https://picsum.photos/100'} className="w-full h-full rounded-lg object-cover" />
                </button>
            </div>
        </div>
    );
};

export default Reels;
