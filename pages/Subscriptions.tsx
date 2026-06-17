
import React, { useEffect, useState } from 'react';
import { getSubscriptionVideos } from '../services/storageService';
import { Video } from '../types';
import VideoCard from '../components/VideoCard';
import { Users, LayoutGrid, List, Loader2, Play, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Subscriptions: React.FC = () => {
    const navigate = useNavigate();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const subVids = await getSubscriptionVideos();
            setVideos(subVids);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <div className="flex flex-col w-full min-h-screen bg-[#020617] pb-32 animate-in fade-in duration-1000">
            {/* Header / Creator Rail */}
            <div className="sticky top-0 z-40 bg-[#020617]/95 backdrop-blur-3xl border-b border-white/5 px-8 md:px-12 py-8 flex flex-col gap-8 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-lg border border-brand/20">
                            <Users size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Subscribed Nodes</h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Direct Neural Stream</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-brand text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Subscribed Channels Rail */}
                <div className="flex gap-8 overflow-x-auto scrollbar-hide pb-2">
                    {/* These would normally come from storage. For demo, we show the active channels if videos found */}
                    {Array.from(new Set(videos.map(v => v.channelName))).map((name, i) => (
                        <div key={i} onClick={() => navigate('/channel')} className="flex flex-col items-center gap-3 cursor-pointer group flex-shrink-0">
                            <div className="relative">
                                <img src={`https://picsum.photos/seed/${name}/100`} className="w-16 h-16 rounded-[1.75rem] object-cover ring-2 ring-white/10 group-hover:ring-brand group-hover:scale-105 transition-all shadow-xl" />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand rounded-full border-2 border-[#020617] animate-pulse shadow-glow-brand"></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest">{name}</span>
                        </div>
                    ))}
                    {videos.length > 0 && (
                        <div className="flex items-center px-4 border-l border-white/10 ml-4">
                            <button className="text-[10px] font-black text-brand uppercase tracking-[0.3em] hover:underline whitespace-nowrap">Manage Subscriptions</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-8 md:px-12 pt-12 max-w-[1800px] mx-auto w-full">
                {loading ? (
                    <div className="py-40 flex justify-center"><Loader2 className="animate-spin text-brand" size={48} /></div>
                ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-center opacity-30 animate-pulse">
                        <div className="p-10 bg-white/5 rounded-[4rem] mb-8">
                            <Sparkles size={80} className="text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-[0.3em] mb-4 text-white">No New Transmissions</h3>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest max-w-xs leading-relaxed">Join channels to receive content in this direct neural stream.</p>
                        <button 
                            onClick={() => navigate('/')} 
                            className="mt-12 bg-brand/10 border border-brand/20 text-brand px-12 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:bg-brand hover:text-white transition-all shadow-2xl"
                        >
                            Discover Channels
                        </button>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-20" : "flex flex-col gap-8 max-w-4xl mx-auto"}>
                        {videos.map(v => (
                            <div key={v.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <VideoCard video={v} layout={viewMode === 'list' ? 'row' : 'grid'} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Subscriptions;
