
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MarketplaceItem } from '../types';
import { MessageCircle, MapPin, Heart, ArrowLeft, Share2, Crown, ShieldCheck, ChevronRight, Zap } from 'lucide-react';
import { marketplaceService } from '../services/marketplaceService';
import { useAuth } from '../hooks/useAuth';
import CreatorChatPanel from '../components/CreatorChatPanel';

const MarketplaceItemPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const item = (location.state as any)?.item as MarketplaceItem;
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeImage, setActiveImage] = useState(0);

    if (!item) return <div className="p-10 text-white bg-[#020617] min-h-screen">Item not found.</div>;

    const handleMessageSeller = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setIsChatOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans overflow-x-hidden animate-in fade-in duration-500">
            {/* Detail Header */}
            <div className="bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-50 p-6 flex items-center gap-6 border-b border-white/5 shadow-2xl">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-90 border border-white/5 text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={22} />
                </button>
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tighter italic truncate max-w-md">{item.title}</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-brand animate-pulse"></div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Inventory Detail v4.0</span>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 md:p-12 lg:p-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                {/* Visual Node (Left) */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="aspect-square bg-slate-900 rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,1)] border border-white/5 relative group">
                        <img 
                            src={item.photos[activeImage] || 'https://picsum.photos/seed/item/800'} 
                            className="w-full h-full object-cover transition-all duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                    </div>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                        {item.photos.map((p, i) => (
                            <div 
                                key={i} 
                                onClick={() => setActiveImage(i)}
                                className={`aspect-square rounded-[1.5rem] overflow-hidden border-2 transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 ${activeImage === i ? 'border-brand scale-110 shadow-brand/20' : 'border-white/5 opacity-50 hover:opacity-100'}`}
                            >
                                <img src={p} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inventory Meta (Right) */}
                <div className="lg:col-span-5 space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                             <div className="bg-brand/10 text-brand px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-brand/20 shadow-glow-brand animate-glow-pulse">
                                <Zap size={10} className="inline mr-1" /> High Resonance Item
                             </div>
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.category} • {item.condition.toUpperCase()}</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">{item.title}</h1>
                        
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white italic tracking-tighter">
                                <span className="text-brand text-xl align-top mr-1 font-black">$</span>
                                {item.price.toLocaleString()}
                            </span>
                            <span className="text-slate-600 font-bold uppercase text-xs tracking-widest ml-2">Secure Link Exchange</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button 
                                onClick={handleMessageSeller}
                                className="flex-1 bg-brand text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(99,102,241,0.3)] active:scale-95 transition-all uppercase text-[11px] tracking-[0.25em] hover:bg-brand-600"
                            >
                                <MessageCircle size={20} /> Initiate Link
                            </button>
                            <div className="flex gap-4">
                                <button className="p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:text-red-500 transition-all active:scale-90 shadow-2xl">
                                    <Heart size={24} />
                                </button>
                                <button className="p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:text-brand transition-all active:scale-90 shadow-2xl">
                                    <Share2 size={24} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Spec Node */}
                    <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3.5rem] shadow-2xl space-y-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={100} /></div>
                        
                        <div className="space-y-6">
                            <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-500 italic">CORE TRANSMISSION</h3>
                            <div className="grid grid-cols-2 gap-y-6 text-sm">
                                <div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">State</p>
                                    <p className="font-black uppercase tracking-tight text-white">{item.condition}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Location</p>
                                    <p className="font-black uppercase tracking-tight text-white flex items-center gap-2"><MapPin size={14} className="text-brand" /> {item.city || 'Remote Node'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5" />

                        <div className="space-y-4">
                            <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-500 italic">DESCRIPTION</h3>
                            <p className="text-slate-300 font-medium leading-relaxed italic text-[16px]">
                                "{item.description || 'No digital narrative provided for this node.'}"
                            </p>
                        </div>

                        {item.profiles && (
                            <div 
                                // Fix: Updated to use username instead of handle as handle does not exist on Profile type.
                                // Prepending '@' to match the system's handle format.
                                onClick={() => navigate(`/channel/@${item.profiles?.username}`)}
                                className="flex items-center justify-between p-6 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group shadow-2xl"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="relative">
                                        <img src={item.profiles?.avatar_url || 'https://picsum.photos/seed/guest/100'} className="w-14 h-14 rounded-2xl object-cover shadow-xl border border-white/10 group-hover:scale-105 transition-transform" />
                                        <div className="absolute -top-1 -right-1 bg-brand p-1 rounded-lg border-2 border-[#020617] shadow-lg"><Crown size={10} className="text-white" /></div>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[15px] uppercase tracking-tight text-white group-hover:text-brand transition-colors italic">@{item.profiles?.username}</h4>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Verified Identity Node</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-700 group-hover:text-white transition-all translate-x-2 group-hover:translate-x-0" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-center py-6 gap-6 opacity-20">
                         <span className="text-[8px] font-black uppercase tracking-[1em]">AzkaarPay Secured</span>
                    </div>
                </div>
            </div>

            {isChatOpen && item.profiles && (
                <CreatorChatPanel 
                    creator={item.profiles} 
                    onClose={() => setIsChatOpen(false)} 
                />
            )}
        </div>
    );
};

export default MarketplaceItemPage;
