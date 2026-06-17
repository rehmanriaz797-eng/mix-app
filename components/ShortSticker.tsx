
import React, { useState } from 'react';
import { InteractiveSticker } from '../types';
import { voteOnPoll, getPollVote } from '../services/storageService';
import { MessageCircle, CheckCircle2, ShoppingBag } from 'lucide-react';

interface StickerProps {
    sticker: InteractiveSticker;
    onAction?: () => void;
}

const ShortSticker: React.FC<StickerProps> = ({ sticker, onAction }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(getPollVote(sticker.id));

    const handlePollVote = (idx: number) => {
        if (selectedOption !== null) return;
        voteOnPoll(sticker.id, idx);
        setSelectedOption(idx);
        if (navigator.vibrate) navigator.vibrate(20);
    };

    const style = {
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        transform: 'translate(-50%, -50%)'
    };

    if (sticker.type === 'poll') {
        const total = sticker.data.votes.reduce((a: number, b: number) => a + b, 0) + (selectedOption !== null ? 1 : 0);
        
        return (
            <div style={style} className="absolute z-[60] min-w-[200px] bg-black/60 backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] shadow-2xl animate-in zoom-in duration-300 pointer-events-auto">
                <p className="text-white font-black text-xs uppercase tracking-widest mb-4 italic">{sticker.data.question}</p>
                <div className="space-y-2">
                    {sticker.data.options.map((opt: string, idx: number) => {
                        const count = sticker.data.votes[idx] + (selectedOption === idx ? 1 : 0);
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        
                        return (
                            <button 
                                key={idx}
                                onClick={() => handlePollVote(idx)}
                                className={`w-full relative h-10 rounded-xl overflow-hidden border transition-all ${selectedOption === idx ? 'border-brand' : 'border-white/5'}`}
                            >
                                <div className={`absolute inset-0 bg-white/5 transition-all ${selectedOption !== null ? 'opacity-100' : 'opacity-0'}`} style={{ width: `${pct}%`, backgroundColor: selectedOption === idx ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)' }}></div>
                                <div className="relative px-4 flex items-center justify-between h-full">
                                    <span className="text-[11px] font-black uppercase text-white">{opt}</span>
                                    {selectedOption !== null && <span className="text-[10px] font-black text-slate-400">{pct}%</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (sticker.type === 'qa') {
        return (
            <div style={style} className="absolute z-[60] min-w-[240px] bg-white text-black p-5 rounded-[2.5rem] shadow-2xl animate-bounce-slow pointer-events-auto cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-black rounded-xl text-white"><MessageCircle size={16}/></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Q&A Session</span>
                </div>
                <p className="text-sm font-bold leading-tight">{sticker.data.question}</p>
                <div className="mt-3 text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-brand transition-colors">Tap to answer node</div>
            </div>
        );
    }

    return null;
};

export default ShortSticker;
