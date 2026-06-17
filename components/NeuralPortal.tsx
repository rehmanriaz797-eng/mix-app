
import React, { useEffect, useState } from 'react';
import { OpeningThemeConfig } from '../types';
import { Play } from 'lucide-react';

const NeuralPortal: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [phase, setPhase] = useState<'entering' | 'done'>('entering');

    useEffect(() => {
        // Spatial Audio Feedback
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.start(); osc.stop(ctx.currentTime + 0.8);
        } catch (e) {}

        if (navigator.vibrate) navigator.vibrate([15, 30]);

        setTimeout(() => { setPhase('done'); onComplete(); }, 900);
    }, []);

    if (phase === 'done') return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020617] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <div className="flex flex-col items-center gap-10">
                <div className="relative w-24 h-24 flex items-center justify-center animate-in zoom-in duration-500">
                    <div className="absolute inset-0 bg-brand rounded-[2.25rem] shadow-[0_0_100px_rgba(99,102,241,0.5)] animate-pulse"></div>
                    <Play size={40} fill="white" className="text-white relative z-10 ml-1.5" />
                </div>
                <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                        Azkaar<span className="text-brand">Tube</span>
                    </h1>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.8em] ml-2">Neural Broadcast</span>
                </div>
            </div>
            <div className="absolute bottom-16 w-1/4 h-[2px] bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand animate-progress"></div>
            </div>
        </div>
    );
};

export default NeuralPortal;
