

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getAnalytics, getUserChannel, getUploadedVideos, deleteVideo, updateVideo, getComments } from './services/storageService';
import { Channel, AnalyticsData, Video, Comment } from './types';
import { 
    BarChart, Users, Eye, ThumbsUp, ArrowUp, LayoutDashboard, 
    Video as VideoIcon, PenSquare, Trash2, X, MoreHorizontal,
    TrendingUp, DollarSign, Globe, Smartphone, MousePointer2,
    MessageSquare, CheckCircle, Flag, Heart, Reply, Sparkles
} from 'lucide-react';

const Studio: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'dashboard';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
        const [anData, chData, vidData] = await Promise.all([
            getAnalytics(),
            getUserChannel(),
            getUploadedVideos()
        ]);
        setAnalytics(anData);
        setChannel(chData);
        setVideos(vidData);
        
        // Mocking fetching all comments across videos for community tab
        const comments = await getComments('any');
        setAllComments(comments);
    } catch (e) {
        console.error("Studio Load Failed", e);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
          try {
              await deleteVideo(id);
              refreshData();
          } catch (e) {
              alert("Failed to delete video");
          }
      }
  };

  const handleEditSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingVideo) {
          try {
             await updateVideo(editingVideo);
             setEditingVideo(null);
             refreshData();
          } catch (e) {
             alert("Failed to update video");
          }
      }
  };

  if (loading || !analytics || !channel) return <div className="p-10 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">BOOTING STUDIO INTERFACE...</div>;

  return (
    <div className="flex min-h-screen bg-yt-base">
        {/* Studio Sidebar */}
        <div className="w-72 bg-yt-spec border-r border-yt-border hidden md:flex flex-col pt-8">
             <div className="px-6 mb-10 flex flex-col items-center text-center">
                 <div className="relative mb-4">
                    <img src={channel.avatar} className="w-24 h-24 rounded-[2rem] border-4 border-yt-base object-cover shadow-2xl" />
                    <div className="absolute -bottom-1 -right-1 bg-brand p-1.5 rounded-xl shadow-lg border-2 border-yt-base text-white">
                        <CheckCircle size={14} fill="currentColor" className="text-white" />
                    </div>
                 </div>
                 <h2 className="font-black text-sm uppercase tracking-tight">Your channel</h2>
                 <p className="text-yt-textSec text-[10px] font-bold uppercase mt-1 tracking-widest">{channel.name}</p>
             </div>

             <nav className="flex-1 px-4 space-y-2">
                 <SidebarItem 
                    icon={LayoutDashboard} 
                    label="Dashboard" 
                    active={activeTab === 'dashboard'} 
                    onClick={() => setActiveTab('dashboard')} 
                 />
                 <SidebarItem 
                    icon={VideoIcon} 
                    label="Content" 
                    active={activeTab === 'content'} 
                    onClick={() => setActiveTab('content')} 
                 />
                 <SidebarItem 
                    icon={BarChart} 
                    label="Analytics" 
                    active={activeTab === 'analytics'} 
                    onClick={() => setActiveTab('analytics')} 
                 />
                 <SidebarItem 
                    icon={Users} 
                    label="Community" 
                    active={activeTab === 'community'} 
                    onClick={() => setActiveTab('community')} 
                 />
             </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 overflow-y-auto h-screen scrollbar-hide">
           <div className="flex items-center justify-between mb-10">
               <div>
                   <h1 className="text-3xl font-black text-white capitalize tracking-tighter">{activeTab}</h1>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Real-time Azkaar Intelligence Hub</p>
               </div>
               <button className="bg-brand/10 border border-brand/20 text-brand px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand hover:text-white transition-all">
                   Studio V3.2
               </button>
           </div>

           {activeTab === 'dashboard' && (
               <React.Fragment>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard icon={Eye} label="Total Views" value={analytics.totalViews.toLocaleString()} sub="+12% this week" color="text-blue-400" />
                    <StatCard icon={Users} label="Subscribers" value={channel.subscribers.toLocaleString()} sub="+5 new" color="text-purple-400" />
                    <StatCard icon={ThumbsUp} label="Total Likes" value={analytics.totalLikes.toLocaleString()} sub="+8% this week" color="text-pink-400" />
                    <StatCard icon={DollarSign} label="Est. Revenue" value="$1,204.50" sub="+$42.20 today" color="text-green-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-yt-spec rounded-[2.5rem] p-8 border border-yt-border shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={140} /></div>
                        <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2 uppercase tracking-tight">
                            <TrendingUp className="text-brand" size={20} /> Traffic Pulse
                        </h3>
                        <div className="h-64 flex items-end justify-between gap-3">
                            {analytics.viewsHistory.map((val, i) => (
                                <div key={i} className="flex flex-col items-center flex-1 gap-4 group cursor-pointer">
                                    <div className="relative w-full bg-white/5 rounded-2xl hover:bg-brand/10 transition-all duration-500 h-full flex items-end group-hover:scale-105">
                                            <div 
                                                className="w-full bg-gradient-to-t from-brand-600 to-brand-400 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all rounded-2xl min-h-[8px] animate-in slide-in-from-bottom duration-1000"
                                                style={{ height: `${(val / Math.max(...analytics.viewsHistory)) * 100}%` }}
                                            ></div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">D{i+1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-yt-spec rounded-[2.5rem] p-8 border border-yt-border shadow-2xl">
                        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Recent Spotlight</h3>
                        <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 bg-black ring-1 ring-white/5 group">
                            {videos.length > 0 ? (
                                <img src={videos[0].thumbnailUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-yt-textSec font-black uppercase text-[10px]">No Content</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 right-4">
                                <p className="text-white text-xs font-black line-clamp-1 uppercase tracking-tight">{videos[0]?.title}</p>
                            </div>
                        </div>
                        {videos.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-yt-textSec">Performance Rank</span>
                                    <span className="text-white">Top 3 of 10</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-yt-textSec">Watch Time</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-white">42.5 hrs</span>
                                        <ArrowUp size={12} className="text-green-500" />
                                    </div>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-brand w-[85%]"></div>
                                </div>
                            </div>
                        )}
                        <button 
                            onClick={() => setActiveTab('analytics')}
                            className="w-full mt-8 py-4 bg-white/5 hover:bg-brand hover:text-white transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >
                            View Deep Analytics
                        </button>
                    </div>
                </div>
               </React.Fragment>
           )}

           {activeTab === 'content' && (
               <div className="bg-yt-spec rounded-[2.5rem] border border-yt-border overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                           <thead>
                               <tr className="border-b border-yt-border text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] bg-white/5">
                                   <th className="p-6 w-[450px]">Video Journey</th>
                                   <th className="p-6">Status</th>
                                   <th className="p-6 text-center">Engagement</th>
                                   <th className="p-6">Timeline</th>
                                   <th className="p-6 text-right">Control</th>
                               </tr>
                           </thead>
                           <tbody className="text-sm">
                               {videos.length === 0 ? (
                                   <tr>
                                       <td colSpan={5} className="p-20 text-center text-slate-600 font-black uppercase tracking-widest italic">
                                           The library is empty. Start your first upload.
                                       </td>
                                   </tr>
                               ) : (
                                   videos.map(video => (
                                       <tr key={video.id} className="border-b border-yt-border hover:bg-white/[0.02] group transition-colors">
                                           <td className="p-6">
                                               <div className="flex gap-6">
                                                   <div className="w-32 aspect-video bg-black rounded-2xl overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                                                       <img src={video.thumbnailUrl} className="w-full h-full object-cover" />
                                                   </div>
                                                   <div className="flex flex-col justify-center gap-1.5">
                                                       <span className="font-black text-sm text-white line-clamp-1 uppercase tracking-tight">{video.title}</span>
                                                       <span className="text-[10px] font-bold text-slate-500 line-clamp-1 uppercase tracking-widest italic">{video.description || "Experimental entry"}</span>
                                                   </div>
                                               </div>
                                           </td>
                                           <td className="p-6">
                                               <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full w-fit">
                                                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                   <span className="text-[9px] font-black uppercase tracking-widest">Public</span>
                                               </div>
                                           </td>
                                           <td className="p-6 text-center">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-white font-black text-xs uppercase">{video.views}</span>
                                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">{video.likes || 0} Likes</span>
                                                </div>
                                           </td>
                                           <td className="p-6 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                               {video.postedAt}
                                           </td>
                                           <td className="p-6 text-right">
                                               <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                                   <button 
                                                    onClick={() => setEditingVideo(video)}
                                                    className="p-3 bg-white/5 hover:bg-brand hover:text-white rounded-2xl transition-all" title="Edit Meta"
                                                   >
                                                       <PenSquare size={18} />
                                                   </button>
                                                   <button 
                                                    onClick={() => handleDelete(video.id)}
                                                    className="p-3 bg-white/5 hover:bg-red-500 hover:text-white rounded-2xl transition-all text-red-500" title="Delete Permanent"
                                                   >
                                                       <Trash2 size={18} />
                                                   </button>
                                               </div>
                                           </td>
                                       </tr>
                                   ))
                               )}
                           </tbody>
                       </table>
                   </div>
               </div>
           )}

           {activeTab === 'analytics' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-yt-spec rounded-[2.5rem] border border-yt-border p-10 shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-10 opacity-5"><BarChart size={200} /></div>
                             <div className="flex items-center justify-between mb-12">
                                 <div>
                                     {/* Fix: Added missing opening bracket for h3 tag */}
                                     <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Detailed Growth</h3>
                                     <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Retention and Engagement metrics</p>
                                 </div>
                                 <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
                                     <option>Last 28 Days</option>
                                     <option>Last 90 Days</option>
                                     <option>Lifetime</option>
                                 </select>
                             </div>
                             
                             <div className="h-80 w-full flex items-end justify-between gap-2 px-4 relative">
                                 {/* Virtual Grid Lines */}
                                 <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-5">
                                     {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-white"></div>)}
                                 </div>
                                 
                                 {analytics.viewsHistory.concat([45, 60, 30, 80]).map((v, i) => (
                                     <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end relative z-10">
                                         <div 
                                            className="w-full bg-brand/10 hover:bg-brand/30 rounded-full transition-all duration-700 min-h-[10px]"
                                            style={{ height: `${(v / 100) * 100}%` }}
                                         >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black px-2 py-1 rounded-lg text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                                                {v}k Views
                                            </div>
                                         </div>
                                         <span className="text-[8px] font-black text-slate-600 uppercase">Week {i+1}</span>
                                     </div>
                                 ))}
                             </div>
                        </div>

                        <div className="bg-yt-spec rounded-[2.5rem] border border-yt-border p-10 shadow-2xl flex flex-col gap-8">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Real-time Signals</h3>
                            
                            <div className="space-y-8">
                                <MetricProgress icon={Globe} label="Geo Coverage" val={78} color="bg-blue-400" />
                                <MetricProgress icon={Smartphone} label="Mobile Vibe" val={92} color="bg-purple-400" />
                                <MetricProgress icon={MousePointer2} label="CTR Intensity" val={12.4} color="bg-brand" isRaw />
                            </div>

                            <div className="mt-auto p-6 bg-white/5 rounded-3xl border border-white/5">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">AI Prediction</div>
                                <p className="text-white text-xs font-medium leading-relaxed italic opacity-80">"Your subscriber count is projected to increase by 15% next month based on current retention spikes."</p>
                            </div>
                        </div>
                    </div>
               </div>
           )}

           {activeTab === 'community' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                        {/* Stats mini bar */}
                        <div className="xl:col-span-1 space-y-6">
                            <div className="bg-yt-spec rounded-[2.5rem] border border-yt-border p-8 shadow-2xl">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Audience Sentiment</h4>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl"><Heart size={20} fill="currentColor" /></div>
                                    <div>
                                        <div className="text-xl font-black text-white">98%</div>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Positive Vibe</div>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[98%] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                </div>
                            </div>

                            <div className="bg-yt-spec rounded-[2.5rem] border border-yt-border p-8 shadow-2xl">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Quick Actions</h4>
                                <button className="w-full py-4 bg-brand/10 border border-brand/20 text-brand rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all mb-3">Create Community Post</button>
                                <button className="w-full py-4 bg-white/5 border border-white/5 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">Moderate All Queue</button>
                            </div>
                        </div>

                        {/* Recent Comments Feed */}
                        <div className="xl:col-span-3 bg-yt-spec rounded-[2.5rem] border border-yt-border shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-yt-border bg-white/5 flex items-center justify-between">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <MessageSquare className="text-brand" size={20} /> Latest Feedback
                                </h3>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white border border-white/5">Published</button>
                                    <button className="px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white border border-white/5">Held for Review</button>
                                </div>
                            </div>
                            
                            <div className="divide-y divide-yt-border">
                                {allComments.map((c, i) => (
                                    <div key={i} className="p-8 hover:bg-white/[0.01] transition-all group flex gap-6">
                                        {/* Fixed: Reference correct avatar property */}
                                        <img src={c.avatar} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/5 shadow-xl shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-white font-black text-xs uppercase tracking-tight">{c.author}</span>
                                                    {/* Fixed: Display formatted creation date instead of missing timeAgo */}
                                                    <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-brand transition-all"><Heart size={16}/></button>
                                                    <button className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-brand transition-all"><Reply size={16}/></button>
                                                    <button className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-500 transition-all"><Flag size={16}/></button>
                                                    <button className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><MoreHorizontal size={16}/></button>
                                                </div>
                                            </div>
                                            <p className="text-slate-300 text-sm font-medium leading-relaxed">{c.text}</p>
                                            <div className="pt-2">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/5 border border-brand/10 rounded-xl text-[9px] font-black text-brand uppercase tracking-widest">
                                                    <Sparkles size={10} /> AI Score: 95%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
               </div>
           )}
        </div>

        {/* Global Modals */}
        {editingVideo && (
            <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="bg-yt-spec w-full max-w-xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-yt-border flex flex-col max-h-[90vh] overflow-hidden">
                    <div className="flex justify-between items-center p-8 border-b border-yt-border bg-white/5">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Edit Neural Node</h2>
                        <button onClick={() => setEditingVideo(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                            <X size={24} />
                        </button>
                    </div>
                    <form onSubmit={handleEditSave} className="p-8 space-y-6 overflow-y-auto">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Broadcast Title</label>
                            <input 
                                className="w-full bg-black border border-white/10 rounded-2xl p-5 focus:border-brand outline-none text-white font-black text-lg transition-all"
                                value={editingVideo.title}
                                onChange={e => setEditingVideo({...editingVideo, title: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Neural Insight (Description)</label>
                            <textarea 
                                className="w-full bg-black border border-white/10 rounded-2xl p-5 focus:border-brand outline-none h-40 resize-none text-slate-300 font-medium leading-relaxed transition-all"
                                value={editingVideo.description}
                                onChange={e => setEditingVideo({...editingVideo, description: e.target.value})}
                            />
                        </div>
                        <div className="flex justify-end gap-4 pt-6">
                             <button 
                                type="button"
                                onClick={() => setEditingVideo(null)}
                                className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all"
                             >
                                 ABORT
                             </button>
                             <button 
                                type="submit"
                                className="px-10 py-4 bg-brand text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-brand-600 shadow-2xl shadow-brand/30 transition-all active:scale-95"
                             >
                                 UPDATE NODE
                             </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`flex items-center gap-5 px-6 py-4 rounded-[1.5rem] cursor-pointer transition-all group ${active ? 'bg-brand text-white shadow-xl shadow-brand/20 border border-brand/20' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
    >
        <div className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'animate-float' : ''}`}>
            <Icon size={22} strokeWidth={active ? 3 : 2} />
        </div>
        <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white] animate-pulse"></div>}
    </div>
);

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
    <div className="bg-yt-spec p-8 rounded-[2.5rem] border border-yt-border hover:border-brand/30 transition-all cursor-pointer group shadow-xl">
        <div className="flex items-start justify-between mb-6">
            <div>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mb-2">{label}</p>
                <h3 className="text-3xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">{value}</h3>
            </div>
            <div className={`p-3 bg-white/5 rounded-2xl group-hover:bg-brand transition-all ${color}`}>
                <Icon size={24} className="group-hover:text-white transition-colors" />
            </div>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/5 px-2 py-1 rounded-lg w-fit">
            <TrendingUp size={10} /> {sub}
        </div>
    </div>
);

const MetricProgress = ({ icon: Icon, label, val, color, isRaw }: any) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="flex items-center gap-3">
                <Icon size={16} className="text-slate-500" />
                <span className="text-slate-300">{label}</span>
            </div>
            <span className="text-white">{isRaw ? val : `${val}%`}</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${color} transition-all duration-[1500ms] shadow-lg`} style={{ width: `${isRaw ? 100 : val}%` }}></div>
        </div>
    </div>
);

export default Studio;
