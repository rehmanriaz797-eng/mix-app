
import React, { useEffect, useState } from 'react';
import { getTrendingVideos } from '../services/storageService';
import { Video } from '../types';
import VideoCard from '../components/VideoCard';
import { Flame, Music2, Gamepad2, Film, Loader2 } from 'lucide-react';

const Trending: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Now');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const trend = await getTrendingVideos();
            setVideos(trend);
            setLoading(false);
        };
        load();
    }, []);

    const categories = [
        { id: 'Now', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'Music', icon: Music2, color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { id: 'Gaming', icon: Gamepad2, color: 'text-brand', bg: 'bg-brand/10' },
        { id: 'Movies', icon: Film, color: 'text-cyan-500', bg: 'bg-cyan-500/10' }
    ];

    return (
        <div className="flex flex-col w-full min-h-screen bg-[#020617] p-8 md:p-12 pb-32 animate-in fade-in duration-1000">
            <div className="flex flex-col gap-12 max-w-[1800px] mx-auto w-full">
                {/* Header */}
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.1)]">
                        <Flame size={32} />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">Trending Now</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">Neural Velocity Tracker Active</p>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-8 py-5 rounded-[2rem] flex items-center gap-4 transition-all border whitespace-nowrap group ${
                                activeCategory === cat.id 
                                ? `${cat.bg} border-brand/20 text-white shadow-xl scale-105` 
                                : 'bg-white/5 border-transparent text-slate-500 hover:text-white'
                            }`}
                        >
                            <cat.icon size={20} className={activeCategory === cat.id ? cat.color : 'group-hover:scale-110 transition-transform'} />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{cat.id}</span>
                        </button>
                    ))}
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="animate-spin text-brand" size={48} />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Scanning High-Resonance Signals...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-16">
                        {videos.map((v, i) => (
                            <div key={v.id} className="relative group animate-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="absolute -top-6 -left-2 text-7xl font-black text-white/5 italic pointer-events-none group-hover:text-brand/10 transition-colors z-0">
                                    #{i + 1}
                                </div>
                                <div className="relative z-10">
                                    <VideoCard video={v} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Trending;
