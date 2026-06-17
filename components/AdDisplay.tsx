
import React, { useState, useEffect } from 'react';
import { monetizationService } from '../services/monetizationService';
import { subscriptionService } from '../services/subscriptionService';
import { Play, Volume2, VolumeX, FastForward, Info, Zap } from 'lucide-react';

interface AdDisplayProps {
    videoId: string;
    onComplete: () => void;
}

const AdDisplay: React.FC<AdDisplayProps> = ({ videoId, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(15);
    const [canSkip, setCanSkip] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        // --- PREMIUM CHECK ---
        const sub = subscriptionService.getSubscriptionStatus();
        if (sub && sub.status === 'active') {
            setIsPremium(true);
            onComplete(); // Skip ads immediately for premium users
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onComplete();
                    return 0;
                }
                if (prev <= 10) setCanSkip(true);
                return prev - 1;
            });
        }, 1000);

        // Track impression
        monetizationService.logAdImpression({
            video_id: videoId,
            viewer_id: 'viewer-anon', 
            cpm: 12.50,
            view_duration: 0,
            is_completed: false,
            region: 'Global',
            ad_type: 'pre_roll'
        });

        return () => clearInterval(timer);
    }, []);

    if (isPremium) return null;

    return (
        <div className="absolute inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-500">
            {/* Ad Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-indigo-900 opacity-40"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center px-6">
                    <div className="w-24 h-24 bg-brand rounded-[2rem] flex items-center justify-center shadow-2xl shadow-brand/40 mb-8 animate-bounce-slow">
                        <Zap size={48} className="text-white fill-white" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Upgrade to Premium</h2>
                    <p className="text-xl text-slate-400 font-medium max-w-md leading-relaxed">Remove ads forever and support your favorite creators.</p>
                    <button className="mt-10 px-10 py-4 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform">
                        Go Ad-Free
                    </button>
                </div>
            </div>

            <div className="h-20 bg-black/60 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                        <Info size={14} className="text-slate-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sponsored</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-white font-black text-sm tracking-widest flex items-center gap-2">
                        AD • 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                    </div>
                    
                    {canSkip ? (
                        <button 
                            onClick={onComplete}
                            className="flex items-center gap-3 bg-white text-black px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand hover:text-white transition-all group"
                        >
                            Skip Ad <FastForward size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <div className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest">
                            Skip in {timeLeft - 10}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdDisplay;
