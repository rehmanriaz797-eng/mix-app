
import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, X, CheckCircle2, LayoutGrid, Settings, MessageCircle, Heart, MessageSquare, Radio, Sparkles, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { getUploadedVideos, getUserChannel, updateUserChannel, getChannelByHandle, INITIAL_VIDEOS, getCommunityPosts, getLiveStreams, saveCommunityPost } from '../services/storageService';
import { Video, Channel as ChannelType, CommunityPost, LiveStream } from '../types';
import { useAuth } from '../hooks/useAuth';
import CreatorChatPanel from '../components/CreatorChatPanel';

const Channel: React.FC = () => {
  const navigate = useNavigate();
  const { handle } = useParams<{ handle?: string }>();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('Home');
  const [videos, setVideos] = useState<Video[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [channelData, setChannelData] = useState<ChannelType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnChannel, setIsOwnChannel] = useState(false);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [communityInput, setCommunityInput] = useState('');
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ChannelType>>({});

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            let data: ChannelType | null = null;
            let vids: Video[] = [];
            const targetHandle = handle || '@creator';

            data = await getChannelByHandle(targetHandle);
            const own = await getUserChannel();
            const isOwn = targetHandle === own.handle;
            setIsOwnChannel(isOwn);
            
            if (isOwn) {
                vids = await getUploadedVideos();
            } else {
                vids = INITIAL_VIDEOS.filter(v => v.channelHandle === targetHandle);
            }
            
            setChannelData(data);
            setVideos(vids);
            if (data) {
                setCommunityPosts(getCommunityPosts(data.id));
                setLiveStreams(getLiveStreams(data.id));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    loadData();

    const handleStorage = () => {
        if (channelData) {
            setCommunityPosts(getCommunityPosts(channelData.id));
            setLiveStreams(getLiveStreams(channelData.id));
        }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [handle, channelData?.id]);

  const handlePostCommunity = (e: React.FormEvent) => {
      e.preventDefault();
      if (!communityInput.trim() || !user || !profile || !channelData) return;
      
      const newPost: CommunityPost = {
          id: `post_${Date.now()}`,
          user_id: channelData.id,
          content: communityInput,
          type: 'text',
          likes_count: 0,
          comments_count: 0,
          created_at: new Date().toISOString(),
          profiles: profile as any
      };
      saveCommunityPost(newPost);
      setCommunityInput('');
      setActiveTab('Community');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'avatar') => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
          const result = event.target?.result as string;
          if (channelData) {
              const updated = await updateUserChannel({ [type]: result });
              setChannelData(updated);
          }
      };
      reader.readAsDataURL(file);
  };

  const tabs = ["Home", "Videos", "Shorts", "Live", "Playlists", "Community"];

  const handleSaveCustomize = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editForm) return;
      try {
        const updated = await updateUserChannel(editForm);
        setChannelData(updated);
        setIsCustomizeOpen(false);
      } catch (e) { alert("Failed to update channel"); }
  };

  if (loading) return <div className="p-10 text-center text-white font-black uppercase tracking-widest animate-pulse">Synchronizing Node...</div>;
  if (!channelData) return <div className="p-10 text-white">Channel not found.</div>;

  return (
    <div className="w-full min-h-screen bg-[#020617] text-white relative font-sans">
      <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} className="hidden" accept="image/*" />
      <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" accept="image/*" />

      {/* Banner Section */}
      <div className="w-full h-32 sm:h-48 md:h-72 overflow-hidden relative group bg-slate-900">
        <img src={channelData.banner} className="w-full h-full object-cover opacity-60" alt="Banner" />
        {isOwnChannel && (
            <>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <button 
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute bottom-6 right-8 bg-black/60 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-black/80 hover:scale-105 active:scale-95 shadow-2xl"
                >
                    <Camera size={16} className="text-brand" /> Customize banner
                </button>
            </>
        )}
      </div>

      {/* Profile Info Area */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-8 flex flex-col sm:flex-row gap-8 items-center sm:items-end -mt-16 sm:mt-0 relative z-[100]">
        <div className={`relative group ${isOwnChannel ? 'cursor-pointer' : ''}`} onClick={() => isOwnChannel && avatarInputRef.current?.click()}>
            <img 
              src={channelData.avatar} 
              className="w-32 h-32 sm:w-48 sm:h-48 rounded-[3.5rem] border-[12px] border-[#020617] object-cover bg-slate-800 shadow-2xl group-hover:brightness-90 transition-all" 
              alt="Avatar" 
            />
            <div className="absolute -top-1 -right-1 bg-brand p-1.5 rounded-2xl shadow-xl border-4 border-[#020617]">
                <CheckCircle2 size={18} className="text-white" />
            </div>
            {isOwnChannel && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Camera size={32} className="text-white drop-shadow-lg" />
                </div>
            )}
        </div>
        
        <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left pb-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic text-white mb-2">{channelData.name}</h1>
          <div className="text-slate-400 text-[11px] flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-3 font-black uppercase tracking-widest">
            <span className="text-white font-black">{channelData.handle}</span>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span>{channelData.subscribers.toLocaleString()} Subscribers</span>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span>{videos.length} Broadcasts</span>
          </div>
          <p className="text-slate-500 text-[13px] mt-5 max-w-2xl font-bold leading-relaxed line-clamp-2 italic">{channelData.description}</p>
          
          <div className="mt-8 flex flex-wrap justify-center sm:justify-start gap-3">
             {isOwnChannel ? (
                <>
                    <button onClick={() => { setEditForm(channelData); setIsCustomizeOpen(true); }} className="bg-brand text-white px-10 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-600 transition-all shadow-xl shadow-brand/20 active:scale-95">Customize Persona</button>
                    <button onClick={() => navigate('/studio?tab=content')} className="bg-white/5 border border-white/10 text-white px-10 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95">Node Studio</button>
                    <button onClick={() => setIsChatOpen(true)} className="bg-white/5 border border-white/10 text-white px-10 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95 flex items-center gap-3">
                        <MessageCircle size={18} className="text-brand" /> Messages
                    </button>
                </>
             ) : (
                <>
                    <button className="bg-brand text-white px-12 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-600 transition-all active:scale-95 shadow-xl shadow-brand/30">Join Community</button>
                    <button onClick={() => setIsChatOpen(true)} className="bg-[#0f111a] border border-white/5 text-white px-12 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all active:scale-95 shadow-2xl flex items-center gap-3">
                        <MessageCircle size={18} className="text-brand" /> Message
                    </button>
                </>
             )}
          </div>
        </div>
      </div>

      {/* Persistent Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 mt-10 border-b border-white/5 sticky top-14 bg-[#020617]/90 backdrop-blur-2xl z-20">
         <div className="flex gap-10 overflow-x-auto scrollbar-hide">
             {tabs.map(tab => (
                 <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-6 font-black text-[11px] uppercase tracking-[0.3em] whitespace-nowrap border-b-2 transition-all ${activeTab === tab ? 'text-brand border-brand' : 'text-slate-600 border-transparent hover:text-white'}`}
                 >
                     {tab}
                 </button>
             ))}
             <button className="py-6 ml-auto text-slate-600 hover:text-white transition-colors"><Search size={22} /></button>
         </div>
      </div>

      {/* Main Tabbed Content Area */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
         {activeTab === 'Home' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-14">
                {videos.slice(0, 8).map(v => <VideoCard key={v.id} video={v} />)}
             </div>
         )}

         {activeTab === 'Videos' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-14">
                {videos.length === 0 ? <EmptyState icon={LayoutGrid} label="No Broadcasts" /> : videos.map(v => <VideoCard key={v.id} video={v} />)}
             </div>
         )}

         {activeTab === 'Community' && (
             <div className="max-w-3xl mx-auto space-y-12">
                 {isOwnChannel && (
                     <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles size={100} /></div>
                        <h4 className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-6">Create Community Post</h4>
                        <textarea 
                            value={communityInput}
                            onChange={(e) => setCommunityInput(e.target.value)}
                            placeholder="Share an update with your nodes..."
                            className="w-full bg-black border border-white/5 rounded-2xl p-6 outline-none focus:border-brand transition-all text-white font-medium resize-none h-32 italic"
                        />
                        <div className="flex justify-end mt-4">
                            <button onClick={handlePostCommunity} className="bg-brand text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all">
                                <Send size={14} /> Broadcast Post
                            </button>
                        </div>
                     </div>
                 )}
                 {communityPosts.length === 0 ? (
                     <EmptyState icon={MessageSquare} label="No Community Resonance" />
                 ) : (
                     communityPosts.map(post => (
                         <div key={post.id} className="bg-white/5 border border-white/10 rounded-[3rem] p-8 shadow-2xl transition-all hover:bg-white/[0.07]">
                             <div className="flex items-center gap-4 mb-6">
                                 <img src={post.profiles.avatar_url} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                                 <div>
                                     <h4 className="font-black text-sm text-white uppercase italic">@{post.profiles.username}</h4>
                                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</span>
                                 </div>
                             </div>
                             <p className="text-slate-200 text-base leading-relaxed mb-6 font-medium italic whitespace-pre-wrap">"{post.content}"</p>
                             <div className="flex items-center gap-8 pt-4 border-t border-white/5">
                                 <button className="flex items-center gap-2 text-slate-400 hover:text-brand transition-all"><Heart size={18} /> <span className="text-xs font-black">{post.likes_count}</span></button>
                                 <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-all"><MessageSquare size={18} /> <span className="text-xs font-black">{post.comments_count}</span></button>
                                 <button className="ml-auto text-brand font-black text-[10px] uppercase tracking-widest">Read Threads</button>
                             </div>
                         </div>
                     ))
                 )}
             </div>
         )}

         {activeTab === 'Live' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                 {liveStreams.length === 0 ? (
                     <div className="col-span-full"><EmptyState icon={Radio} label="Node is Offline" /></div>
                 ) : (
                     liveStreams.map(stream => (
                         <div key={stream.id} className="group cursor-pointer">
                             <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 mb-5 group-hover:border-red-500/50 transition-all">
                                 <img src={stream.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                 {stream.is_live && <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-pulse">LIVE</div>}
                                 <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                     <Radio size={10} /> {stream.viewer_count.toLocaleString()} WATCHING
                                 </div>
                             </div>
                             <h3 className="text-white font-black text-xl uppercase italic group-hover:text-red-500 transition-colors">{stream.title}</h3>
                         </div>
                     ))
                 )}
             </div>
         )}

         {activeTab === 'Playlists' && <EmptyState icon={LayoutGrid} label="No Playlists Synchronized" />}
         {activeTab === 'Shorts' && <EmptyState icon={Sparkles} label="Short-form Node Empty" />}
      </div>

      {isCustomizeOpen && (
          <Modal title="Neural Signature" onClose={() => setIsCustomizeOpen(false)}>
              <form onSubmit={handleSaveCustomize} className="space-y-10">
                  <Input label="Channel Label" value={editForm.name || ''} onChange={v => setEditForm({...editForm, name: v})} />
                  <Input label="Digital ID (@handle)" value={editForm.handle || ''} onChange={v => setEditForm({...editForm, handle: v})} />
                  <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2">Broadcast Narrative (Bio)</label>
                      <textarea 
                        className="w-full bg-black border border-white/10 rounded-2xl p-6 focus:border-brand outline-none h-40 resize-none text-slate-300 font-medium leading-relaxed transition-all shadow-inner italic"
                        value={editForm.description || ''}
                        onChange={e => setEditForm({...editForm, description: e.target.value})}
                      />
                  </div>
                  <div className="flex justify-end gap-5">
                      <button type="button" onClick={() => setIsCustomizeOpen(false)} className="px-10 py-5 text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-white transition-all">Abort</button>
                      <button type="submit" className="px-12 py-5 bg-brand text-white font-black rounded-3xl text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-brand/40 transition-all active:scale-95">Sync Identity</button>
                  </div>
              </form>
          </Modal>
      )}

      {isChatOpen && (
          <CreatorChatPanel 
            creator={{
                id: channelData.id,
                username: channelData.handle,
                avatar_url: channelData.avatar,
                is_premium: true 
            } as any}
            onClose={() => setIsChatOpen(false)}
          />
      )}
    </div>
  );
};

const EmptyState = ({ icon: Icon, label }: any) => (
    <div className="flex flex-col items-center justify-center py-32 text-center opacity-20">
        <div className="w-24 h-24 bg-white/5 rounded-[3rem] flex items-center justify-center mb-8">
            <Icon size={48} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-[0.4em] text-white">{label}</h3>
    </div>
);

const Modal = ({ title, children, onClose }: any) => (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="bg-[#0b1026] w-full max-w-xl rounded-[3.5rem] shadow-[0_0_150px_rgba(0,0,0,0.9)] border border-white/5 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-10 border-b border-white/5 bg-white/5">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">{title}</h2>
                <button onClick={onClose} className="p-4 hover:bg-white/10 rounded-[1.5rem] transition-all"><X size={28} /></button>
            </div>
            <div className="p-10 overflow-y-auto scrollbar-hide">{children}</div>
        </div>
    </div>
);

const Input = ({ label, value, onChange }: any) => (
    <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2">{label}</label>
        <input 
            className="w-full bg-black border border-white/10 rounded-2xl p-6 focus:border-brand outline-none text-white font-black text-xl transition-all shadow-inner"
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

export default Channel;
