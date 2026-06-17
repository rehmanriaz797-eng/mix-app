
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Video, Comment, Playlist } from './types';
import { 
    getVideos, getComments, toggleLikeVideo, isVideoLiked, 
    toggleSubscribe, isSubscribedTo, addToHistory, getVideoById, 
    addComment, getPlaylists, toggleVideoInPlaylist, createPlaylist 
} from './services/storageService';
import { analyzeVideoContext } from './services/geminiService';
import { monetizationService } from './services/monetizationService';
/* Fix: Explicitly ensuring correct relative path for CustomVideoPlayer import */
import CustomVideoPlayer from './components/CustomVideoPlayer';
import VideoCard from './components/VideoCard';
import AdSenseBanner from './components/AdSenseBanner';
import { 
    ThumbsUp, Share2, MoreHorizontal, MessageSquare, Sparkles, 
    Loader2, Send, Crown, Users, Plus, X, ListPlus, Gift, Heart,
    Check, Clipboard
} from 'lucide-react';

const Watch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [video, setVideo] = useState<Video | null>((location.state as any)?.video || null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'related' | 'community'>('related');
  
  // Monetization & Playlist UI State
  const [showTipModal, setShowTipModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [tipAmount, setTipAmount] = useState<number>(5);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadVideoData = async () => {
        const foundVideo = video?.id === id ? video : await getVideoById(id);
        if (foundVideo) {
            setVideo(foundVideo);
            finalizeView(foundVideo);
        }
        getComments(id).then(setComments);
        getVideos().then(all => setRelatedVideos(all.filter(v => v.id !== id).slice(0, 12)));
        setPlaylists(getPlaylists());
    };
    const finalizeView = (v: Video) => {
        addToHistory(v);
        setHasLiked(isVideoLiked(v.id));
        setIsSubscribed(isSubscribedTo(v.channelName));
    };
    loadVideoData();
    window.scrollTo(0, 0);
    setAiInsight(null);
  }, [id]);

  const handleTip = async () => {
      if (!video) return;
      try {
          await monetizationService.tipCreator('creator-id', 'viewer-id', tipAmount, video.id);
          alert(`Success! Sent $${tipAmount} to ${video.channelName}`);
          setShowTipModal(false);
          if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
      } catch (e) {
          alert("Payment gateway connection failed.");
      }
  };

  const handlePlaylistToggle = (pid: string) => {
      if (!video) return;
      toggleVideoInPlaylist(pid, video.id);
      setPlaylists(getPlaylists());
      if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPlaylistName.trim() || !video) return;
      createPlaylist(newPlaylistName, video.id);
      setNewPlaylistName('');
      setPlaylists(getPlaylists());
  };

  const handleShare = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
  };

  const handleAIAnalysis = async () => {
    if (!video) return;
    setAiLoading(true);
    setAiInsight(null);
    try {
        const videoElement = document.querySelector('video');
        if (videoElement) {
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const frameBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
            const insight = await analyzeVideoContext(frameBase64, video);
            setAiInsight(insight);
        }
    } catch (e) {
        setAiInsight("AI Insights temporarily out of sync.");
    } finally {
        setAiLoading(false);
    }
  };

  if (!video) return <div className="p-20 text-center animate-pulse font-black text-slate-500 uppercase tracking-widest">Finding Video...</div>;

  return (
    <div className="flex flex-col xl:flex-row gap-8 px-4 sm:px-10 py-8 max-w-[2200px] mx-auto w-full min-h-screen pb-32 relative">
      
      {/* Primary Content (Player + Meta) */}
      <div className="flex-1 min-w-0">
        <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-brand/10 bg-black aspect-video relative group ring-1 ring-white/5">
            <CustomVideoPlayer src={video.videoUrl || ''} poster={video.thumbnailUrl} autoplay videoId={video.id} />
        </div>

        <div className="mt-8 px-2 space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-2">
                    <Sparkles size={12} /> Personalized Recommendation
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">{video.title}</h1>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                    <div className="relative cursor-pointer" onClick={() => navigate('/channel')}>
                        <img src={video.channelAvatarUrl} className="w-14 h-14 rounded-3xl bg-slate-800 object-cover ring-2 ring-white/10" alt="" />
                        <div className="absolute -top-1 -right-1 bg-brand p-1 rounded-full shadow-lg"><Crown size={10} className="text-white" /></div>
                    </div>
                    <div className="flex flex-col mr-8">
                        <span onClick={() => navigate('/channel')} className="font-black text-lg text-white hover:text-brand cursor-pointer transition-colors">{video.channelName}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Creator Verified</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => {
                                const nowSub = toggleSubscribe(video.channelName);
                                setIsSubscribed(nowSub);
                            }}
                            className={`h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isSubscribed ? 'bg-white/5 text-slate-300 border border-white/10' : 'bg-brand text-white shadow-xl shadow-brand/20'}`}
                        >
                            {isSubscribed ? 'Subscribed' : 'Join Community'}
                        </button>
                        <button 
                            onClick={() => setShowTipModal(true)}
                            className="h-12 px-6 rounded-2xl border border-brand/20 text-brand bg-brand/5 font-black text-[10px] uppercase tracking-widest hover:bg-brand/10 transition-all flex items-center gap-2"
                        >
                            <Gift size={16}/> Tip Creator
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleAIAnalysis} disabled={aiLoading} className="flex items-center gap-2 bg-brand/10 border border-brand/20 h-12 px-6 rounded-2xl hover:bg-brand/20 text-brand font-black text-xs uppercase tracking-widest transition-all">
                        {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
                        {aiLoading ? 'Thinking' : 'Smart Insight'}
                    </button>
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl h-12 overflow-hidden">
                        <button onClick={() => {
                            const nowLiked = toggleLikeVideo(video.id);
                            setHasLiked(nowLiked);
                        }} className={`px-6 h-full flex items-center gap-2 hover:bg-white/5 transition-colors ${hasLiked ? 'text-brand' : 'text-slate-300'}`}>
                            <ThumbsUp size={18} /> <span className="font-black text-sm">{video.likes}</span>
                        </button>
                    </div>
                    <button 
                        onClick={() => setShowPlaylistModal(true)}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 h-12 px-6 rounded-2xl text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        <ListPlus size={18} /> Save
                    </button>
                    <button 
                        onClick={handleShare}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 h-12 px-6 rounded-2xl text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all hidden md:flex"
                    >
                        <Share2 size={18} /> Share
                    </button>
                </div>
            </div>

            {aiInsight && (
                <div className="p-8 bg-brand/5 border border-brand/10 rounded-[2.5rem] animate-in zoom-in duration-300">
                    <div className="flex items-center gap-2 text-brand font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                        <Sparkles size={14} /> AI Analysis Report
                    </div>
                    <p className="text-sm font-medium text-slate-200 leading-relaxed italic opacity-90">"{aiInsight}"</p>
                </div>
            )}

            <div className="bg-[#0b1026] rounded-[2.5rem] p-8 border border-white/5 cursor-pointer hover:bg-[#0f1530] transition-all group" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                <div className="flex items-center gap-4 font-black text-xs text-slate-500 uppercase tracking-widest mb-4">
                    <span>{video.views}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                    <span>{video.postedAt}</span>
                </div>
                <div className={`text-[15px] text-slate-300 font-medium leading-relaxed ${isDescriptionExpanded ? "" : "line-clamp-2"}`}>
                    {video.description || "No description provided for this visual journey."}
                </div>
            </div>
        </div>
      </div>

      {/* Secondary Column */}
      <div className="xl:w-[440px] w-full flex flex-col gap-8 flex-shrink-0">
         {/* Top AdSense Slot */}
         <AdSenseBanner slotId="8888888888" className="mb-2" />

         <div className="flex p-1.5 bg-white/5 rounded-3xl border border-white/5">
            <button onClick={() => setActiveTab('related')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'related' ? 'bg-brand text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Up Next</button>
            <button onClick={() => setActiveTab('community')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'community' ? 'bg-brand text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Users size={14} /> Community</button>
         </div>

         {activeTab === 'related' ? (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                {relatedVideos.map((related, idx) => (
                    <React.Fragment key={related.id}>
                        <VideoCard video={related} layout="row" />
                        {idx === 2 && <AdSenseBanner slotId="7777777777" />}
                    </React.Fragment>
                ))}
             </div>
         ) : (
             <div className="flex flex-col h-[600px] xl:h-[800px] bg-[#0b1026] rounded-[2.5rem] border border-white/5 animate-in slide-in-from-right-4 duration-500 overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">Live Discussion</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <img src={comment.avatar} className="w-9 h-9 rounded-2xl bg-slate-800 object-cover ring-1 ring-white/10" alt="" />
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="font-black text-[11px] uppercase tracking-wider text-white">{comment.author}</span>
                                <p className="text-[13px] text-slate-300 font-medium leading-normal">{comment.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
         )}
      </div>

      {/* Share Toast */}
      {showShareToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[500] bg-brand text-white px-8 py-4 rounded-3xl shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-bottom-4">
              <Clipboard size={18} /> URL copied to clipboard
          </div>
      )}

      {/* Playlist Modal */}
      {showPlaylistModal && (
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-[#0b1026] border border-white/10 w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Save to...</h3>
                      <button onClick={() => setShowPlaylistModal(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="p-4 max-h-[300px] overflow-y-auto scrollbar-hide space-y-2">
                      {playlists.map(p => (
                          <label key={p.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl cursor-pointer transition-colors group">
                              <span className="font-black text-sm text-slate-300 group-hover:text-white uppercase tracking-tight">{p.title}</span>
                              <input 
                                type="checkbox"
                                className="w-5 h-5 rounded-lg border-2 border-slate-600 bg-transparent checked:bg-brand checked:border-brand transition-all cursor-pointer"
                                checked={p.video_ids.includes(video.id)}
                                onChange={() => handlePlaylistToggle(p.id)}
                              />
                          </label>
                      ))}
                  </div>

                  <form onSubmit={handleCreatePlaylist} className="p-8 bg-white/5 border-t border-white/5 space-y-4">
                      <input 
                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-black text-white outline-none focus:border-brand transition-all placeholder-slate-600"
                        placeholder="Create new playlist..."
                        value={newPlaylistName}
                        onChange={e => setNewPlaylistName(e.target.value)}
                      />
                      <button 
                        type="submit"
                        disabled={!newPlaylistName.trim()}
                        className="w-full py-4 bg-brand text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-30"
                      >
                        Create and Save
                      </button>
                  </form>
               </div>
          </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-[#0b1026] border border-white/10 w-full max-sm rounded-[3rem] p-10 shadow-2xl relative text-center">
                  <button onClick={() => setShowTipModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
                  
                  <div className="w-20 h-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Gift size={40} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Super Vibe</h3>
                  <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-8">Support {video.channelName}</p>
                  
                  <div className="grid grid-cols-3 gap-3 mb-8">
                      {[5, 10, 25, 50, 100, 500].map(val => (
                          <button 
                            key={val} 
                            onClick={() => setTipAmount(val)}
                            className={`py-4 rounded-2xl border font-black transition-all ${tipAmount === val ? 'bg-brand border-brand text-white shadow-xl shadow-brand/20' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
                          >
                            ${val}
                          </button>
                      ))}
                  </div>

                  <button 
                    onClick={handleTip}
                    className="w-full py-5 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest shadow-2xl hover:bg-brand hover:text-white transition-all active:scale-95"
                  >
                      Confirm Support
                  </button>
                  <p className="mt-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">One-tap checkout powered by AzkaarPay</p>
              </div>
          </div>
      )}
    </div>
  );
};

export default Watch;
