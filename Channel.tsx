
import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, X, CheckCircle2, LayoutGrid, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { getUploadedVideos, getUserChannel, updateUserChannel } from '../services/storageService';
import { Video, Channel as ChannelType } from '../types';

const Channel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Home');
  const [videos, setVideos] = useState<Video[]>([]);
  const [channelData, setChannelData] = useState<ChannelType | null>(null);
  const [loading, setLoading] = useState(true);
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Customize Modal State
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ChannelType>>({});

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const [vids, chan] = await Promise.all([
                getUploadedVideos(),
                getUserChannel()
            ]);
            setVideos(vids);
            setChannelData(chan);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

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

  const handleCustomizeClick = () => {
    if (channelData) {
        setEditForm(channelData);
        setIsCustomizeOpen(true);
    }
  };

  const handleSaveCustomize = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editForm) return;
      try {
        const updated = await updateUserChannel(editForm);
        setChannelData(updated);
        setIsCustomizeOpen(false);
      } catch (e) {
          alert("Failed to update channel");
      }
  };

  if (loading) return <div className="p-10 text-center text-white font-black uppercase tracking-widest animate-pulse">Synchronizing Node...</div>;
  if (!channelData) return <div className="p-10 text-white">Channel not found. Please log in.</div>;

  return (
    <div className="w-full min-h-screen bg-yt-base text-white relative font-sans">
      {/* Hidden File Inputs */}
      <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} className="hidden" accept="image/*" />
      <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" accept="image/*" />

      {/* Banner */}
      <div className="w-full h-32 sm:h-48 md:h-72 overflow-hidden relative group bg-slate-900">
        <img src={channelData.banner} className="w-full h-full object-cover" alt="Banner" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <button 
            onClick={() => bannerInputRef.current?.click()}
            className="absolute bottom-6 right-8 bg-black/60 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-black/80 hover:scale-105 active:scale-95 shadow-2xl"
        >
            <Camera size={16} className="text-brand" /> Customize banner
        </button>
      </div>

      {/* Header Info */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-8 flex flex-col sm:flex-row gap-8 items-center sm:items-end -mt-12 sm:mt-0 relative z-10">
        <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            <img 
              src={channelData.avatar} 
              className="w-32 h-32 sm:w-44 sm:h-44 rounded-[2.5rem] border-8 border-yt-base object-cover bg-slate-800 shadow-2xl group-hover:brightness-75 transition-all" 
              alt="Avatar" 
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera size={32} className="text-white drop-shadow-lg" />
            </div>
            {channelData.handle === '@user' && (
                <div className="absolute -top-1 -right-1 bg-brand p-1.5 rounded-2xl shadow-xl border-4 border-yt-base">
                   <CheckCircle2 size={18} className="text-white" />
                </div>
            )}
        </div>
        
        <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left pb-4">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase italic">{channelData.name}</h1>
          <div className="text-slate-400 text-sm mt-3 flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-3 font-bold uppercase tracking-tight">
            <span className="text-white">{channelData.handle}</span>
            <span className="w-1 h-1 rounded-full bg-slate-800"></span>
            <span>{channelData.subscribers.toLocaleString()} Subscribers</span>
            <span className="w-1 h-1 rounded-full bg-slate-800"></span>
            <span>{videos.length} Broadcasts</span>
          </div>
          <p className="text-slate-500 text-sm mt-4 max-w-2xl font-medium leading-relaxed line-clamp-2">{channelData.description}</p>
          
          <div className="mt-8 flex flex-wrap justify-center sm:justify-start gap-3">
             <button 
                onClick={handleCustomizeClick}
                className="bg-brand text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand/20 active:scale-95"
             >
                 Customize channel
             </button>
             <button 
                onClick={() => navigate('/studio?tab=content')}
                className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
             >
                 Manage videos
             </button>
             <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-colors">
                <Settings size={20} />
             </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 mt-6 border-b border-white/5 sticky top-14 bg-yt-base/80 backdrop-blur-xl z-20">
         <div className="flex gap-10 overflow-x-auto scrollbar-hide">
             {tabs.map(tab => (
                 <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-5 font-black text-[11px] uppercase tracking-[0.2em] whitespace-nowrap border-b-2 transition-all ${activeTab === tab ? 'text-brand border-brand' : 'text-slate-500 border-transparent hover:text-white'}`}
                 >
                     {tab}
                 </button>
             ))}
             <button className="py-5 ml-auto text-slate-500 hover:text-white transition-colors"><Search size={20} /></button>
         </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10">
         {(activeTab === 'Home' || activeTab === 'Videos') && (
             <React.Fragment>
                {videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-30">
                        <div className="p-8 bg-white/5 rounded-[3rem] mb-6">
                            <LayoutGrid size={64} className="text-slate-500" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest mb-2">The Hub is Empty</h3>
                        <p className="text-sm font-bold">Start your digital broadcast to populate this space.</p>
                        <button 
                            onClick={() => navigate('/upload', { state: { fromApp: true } })} 
                            className="mt-10 bg-brand/10 border border-brand/20 text-brand px-10 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand hover:text-white transition-all"
                        >
                            Initiate Broadcast
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                        {videos.map(v => (
                            <div key={v.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <VideoCard video={v} />
                            </div>
                        ))}
                    </div>
                )}
             </React.Fragment>
         )}
      </div>

      {/* Customize Modal */}
      {isCustomizeOpen && (
          <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-yt-spec w-full max-w-xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-yt-border flex flex-col max-h-[90vh] overflow-hidden">
                  <div className="flex justify-between items-center p-8 border-b border-white/5 bg-white/5">
                      <h2 className="text-2xl font-black uppercase tracking-tighter italic">Edit Persona</h2>
                      <button onClick={() => setIsCustomizeOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSaveCustomize} className="p-8 overflow-y-auto space-y-8 scrollbar-hide">
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Channel Name</label>
                          <input 
                            className="w-full bg-black border border-white/10 rounded-2xl p-5 focus:border-brand outline-none text-white font-black text-lg transition-all"
                            value={editForm.name || ''}
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                          />
                      </div>
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Identifier (@handle)</label>
                          <input 
                            className="w-full bg-black border border-white/10 rounded-2xl p-5 focus:border-brand outline-none text-white font-black text-sm transition-all"
                            value={editForm.handle || ''}
                            onChange={e => setEditForm({...editForm, handle: e.target.value})}
                          />
                      </div>
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Neural Insight (Bio)</label>
                          <textarea 
                            className="w-full bg-black border border-white/10 rounded-2xl p-5 focus:border-brand outline-none h-32 resize-none text-slate-300 font-medium leading-relaxed transition-all"
                            value={editForm.description || ''}
                            onChange={e => setEditForm({...editForm, description: e.target.value})}
                          />
                      </div>
                  </form>

                  <div className="p-8 border-t border-white/5 bg-white/5 flex justify-end gap-4">
                      <button 
                        onClick={() => setIsCustomizeOpen(false)}
                        className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all"
                      >
                          Abort
                      </button>
                      <button 
                        onClick={handleSaveCustomize}
                        className="px-10 py-4 bg-brand text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-brand-600 shadow-2xl shadow-brand/30 transition-all active:scale-95"
                      >
                          Save signature
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Channel;
