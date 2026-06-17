
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVideos, getPlaylists, clearHistory } from '../services/storageService';
import { Video, Playlist } from '../types';
import VideoCard from '../components/VideoCard';
import { History, ThumbsUp, ListPlus, Clock, Trash2, ChevronRight, Sparkles } from 'lucide-react';

const Library: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<Video[]>([]);
    const [liked, setLiked] = useState<Video[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const hist = await getVideos('History');
            const likes = await getVideos('liked');
            const plays = getPlaylists();
            setHistory(hist.slice(0, 8));
            setLiked(likes.slice(0, 8));
            setPlaylists(plays);
            setLoading(false);
        };
        load();
    }, []);

    const handleClearHistory = () => {
        if (confirm("Clear all watch history?")) {
            clearHistory();
            setHistory([]);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 uppercase font-black tracking-widest">Loading Library...</div>;

    return (
        <div className="p-6 md:p-10 max-w-[1800px] mx-auto space-y-16 pb-32">
            
            {/* History Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-brand/10 text-brand rounded-2xl"><History size={24} /></div>
                        <h2 className="text-2xl font-black text-white">Recent History</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleClearHistory} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 flex items-center gap-2 transition-colors">
                            <Trash2 size={14} /> Clear All
                        </button>
                        <button onClick={() => navigate('/feed/history')} className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline flex items-center gap-1">
                            See All <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
                {history.length === 0 ? (
                    <div className="h-40 bg-white/5 rounded-[2.5rem] border border-white/5 flex items-center justify-center text-slate-500 font-bold italic">
                        No videos watched recently.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {history.map(v => <VideoCard key={v.id} video={v} />)}
                    </div>
                )}
            </section>

            {/* Playlists Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-brand/10 text-brand rounded-2xl"><ListPlus size={24} /></div>
                        <h2 className="text-2xl font-black text-white">Your Playlists</h2>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    <div onClick={() => navigate('/upload', { state: { fromApp: true } })} className="aspect-video bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/10 transition-all group">
                         <div className="p-4 bg-brand rounded-2xl shadow-xl shadow-brand/20 group-hover:scale-110 transition-transform"><Sparkles size={24} className="text-white" /></div>
                         <span className="text-xs font-black uppercase tracking-widest text-white">New Collection</span>
                    </div>
                    {playlists.map(p => (
                        <div key={p.id} className="aspect-video bg-brand/5 border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-end relative overflow-hidden group cursor-pointer hover:bg-brand/10 transition-all">
                             <div className="absolute top-4 right-4 text-brand font-black text-[10px]">{p.video_ids.length} VIDEOS</div>
                             <h3 className="text-white font-black text-lg line-clamp-1">{p.title}</h3>
                             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Updated {new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Liked Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-brand/10 text-brand rounded-2xl"><ThumbsUp size={24} /></div>
                        <h2 className="text-2xl font-black text-white">Liked Content</h2>
                    </div>
                    <button onClick={() => navigate('/feed/liked')} className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline flex items-center gap-1">
                        See All <ChevronRight size={14} />
                    </button>
                </div>
                {liked.length === 0 ? (
                    <div className="h-40 bg-white/5 rounded-[2.5rem] border border-white/5 flex items-center justify-center text-slate-500 font-bold italic">
                        No liked videos yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {liked.map(v => <VideoCard key={v.id} video={v} />)}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Library;
