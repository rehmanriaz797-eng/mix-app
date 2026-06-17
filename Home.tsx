
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { getVideos, INITIAL_SHORTS } from '../services/storageService';
import { Video, SortShort } from '../types';
import AdSenseBanner from '../components/AdSenseBanner';
import { 
    Sparkles, Coffee, Brain, Laugh, Zap, Target, 
    TrendingUp, Users, Compass, ChevronRight, ChevronLeft, X,
    Gamepad2, Music2, Radio, Code2, Rocket, Camera, Trophy, Map
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'music', label: 'Music', icon: Music2 },
  { id: 'live', label: 'Live', icon: Radio },
  { id: 'coding', label: 'Coding', icon: Code2 },
  { id: 'tech', label: 'AI Tech', icon: Zap },
  { id: 'space', label: 'Deep Space', icon: Rocket },
  { id: 'nature', label: 'Nature', icon: Map },
  { id: 'cinema', label: 'Cinema', icon: Camera },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'chill', label: 'Chill', icon: Coffee },
  { id: 'learn', label: 'Learn', icon: Brain },
  { id: 'funny', label: 'Funny', icon: Laugh },
  { id: 'deep', label: 'Deep', icon: Target }
];

const Home: React.FC = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<SortShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Scrolling Logic for Categories
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const isTrending = location.pathname.includes('/trending');
  const isSubscriptions = location.pathname.includes('/subscriptions');
  const isHistory = location.pathname.includes('/history');
  const isLiked = location.pathname.includes('/liked');

  const getPageTitle = () => {
    if (isTrending) return "Trending Now";
    if (isSubscriptions) return "Subscriptions";
    if (isHistory) return "History";
    if (isLiked) return "Liked Videos";
    if (category) return category.replace(/-/g, ' ');
    return "Recommended for you";
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setLoading(true);
      try {
          let filter = 'All';
          if (isTrending) filter = 'trending';
          else if (isSubscriptions) filter = 'subscriptions';
          else if (isHistory) filter = 'History';
          else if (isLiked) filter = 'liked';
          else if (category) filter = category.replace(/-/g, ' ');
          else if (activeTab !== 'all') filter = activeTab;

          const fetchedVideos = await getVideos(filter);
          const fetchedShorts = INITIAL_SHORTS;

          if (isMounted) {
              setVideos(fetchedVideos);
              setShorts(fetchedShorts);
              setLoading(false);
          }
      } catch (e) {
          console.error(e);
          if (isMounted) setLoading(false);
      }
    };

    loadData();
    window.scrollTo(0, 0);
    return () => { isMounted = false; };
  }, [category, activeTab, location.pathname]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface-100 pb-24 font-sans animate-in fade-in duration-1000">
      
      {/* Sliding Categories (YouTube Style) */}
      {!isHistory && !isLiked && (
        <div className="sticky top-0 z-30 bg-surface-100/90 backdrop-blur-2xl border-b border-white/5 h-[64px] flex items-center px-4 md:px-6">
           <div className="relative w-full flex items-center overflow-hidden">
               
               {/* Left Gradient & Arrow */}
               {showLeftArrow && (
                   <div className="absolute left-0 inset-y-0 z-10 flex items-center bg-gradient-to-r from-surface-100 via-surface-100 to-transparent pr-12">
                       <button 
                           onClick={() => scroll('left')}
                           className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all border border-white/5 active:scale-90"
                       >
                           <ChevronLeft size={20} className="text-white" />
                       </button>
                   </div>
               )}

               {/* Main Scroll Area */}
               <div 
                   ref={scrollRef}
                   onScroll={handleScroll}
                   className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide px-2 w-full transition-all duration-300"
               >
                   <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mr-2 border-r border-white/10 pr-4 hidden md:block shrink-0">FILTER FEED</div>
                   {CATEGORIES.map(cat => (
                       <button
                          key={cat.id}
                          onClick={() => setActiveTab(cat.id)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shrink-0 ${
                              activeTab === cat.id 
                              ? 'bg-brand border-brand text-white shadow-xl shadow-brand/20 scale-[1.05]' 
                              : 'bg-white/5 text-slate-400 hover:text-white border-white/5 hover:bg-white/10'
                          }`}
                       >
                          <cat.icon size={14} className={activeTab === cat.id ? 'text-white' : 'text-slate-500'} />
                          {cat.label}
                       </button>
                   ))}
                   {/* Spacer for right scroll end padding */}
                   <div className="w-10 shrink-0"></div>
               </div>

               {/* Right Gradient & Arrow */}
               {showRightArrow && (
                   <div className="absolute right-0 inset-y-0 z-10 flex items-center bg-gradient-to-l from-surface-100 via-surface-100 to-transparent pl-12">
                       <button 
                           onClick={() => scroll('right')}
                           className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all border border-white/5 active:scale-90"
                       >
                           <ChevronRight size={20} className="text-white" />
                       </button>
                   </div>
               )}
           </div>
        </div>
      )}

      {/* Shorts Shelf - Now only visible when "All" category is selected */}
      {!loading && shorts.length > 0 && activeTab === 'all' && !category && !isHistory && !isLiked && (
          <div className="px-6 md:px-8 pt-8 mb-4">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
                          <Compass size={18} className="text-white" />
                      </div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tight">Shorts</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/shorts')} className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline flex items-center gap-1">
                        VIEW ALL <ChevronRight size={14} />
                    </button>
                  </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2">
                  {shorts.map((short) => (
                      <div 
                        key={short.id} 
                        onClick={() => navigate(`/shorts/${short.id}`)}
                        className="flex-shrink-0 w-[160px] sm:w-[220px] aspect-[9/16] rounded-[1.75rem] md:rounded-[2.5rem] overflow-hidden relative group cursor-pointer bg-slate-900 border border-white/5 hover:border-brand/40 transition-all duration-500 shadow-2xl"
                      >
                          <img src={short.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={short.title} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
                          <div className="absolute bottom-6 left-5 right-5">
                              <h3 className="text-white text-xs md:text-sm font-black line-clamp-2 leading-tight drop-shadow-lg mb-1">{short.title}</h3>
                              <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">{short.likes_count.toLocaleString()} VIEWS</p>
                          </div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                             <div className="p-4 bg-white/20 backdrop-blur-md rounded-full border border-white/20"><Zap className="text-white" fill="white" size={20} /></div>
                          </div>
                      </div>
                  ))}
              </div>
              <div className="h-px w-full bg-white/5 mt-8"></div>
          </div>
      )}

      {/* Page Title Context */}
      <div className="px-6 md:px-8 pt-6 flex items-center justify-between animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="flex items-center gap-3">
              {isTrending && <TrendingUp size={20} className="text-brand" />}
              {isSubscriptions && <Users size={20} className="text-brand" />}
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">{getPageTitle()}</h2>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest hidden sm:inline">• Neural Verified</span>
          </div>
      </div>

      {/* Video Grid */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10 md:gap-y-12">
            {loading && videos.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-4 animate-pulse px-2">
                    <div className="aspect-video bg-slate-900 rounded-2xl md:rounded-[2.5rem]"></div>
                    <div className="flex gap-4 px-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 shrink-0"></div>
                    <div className="space-y-2 w-full">
                        <div className="h-3.5 bg-slate-900 rounded w-3/4"></div>
                        <div className="h-2.5 bg-slate-900 rounded w-1/2"></div>
                    </div>
                    </div>
                </div>
                ))
            : videos.map((video, idx) => (
                <div 
                    key={video.id} 
                    className="animate-in fade-in slide-in-from-bottom-8 duration-700"
                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                >
                    <VideoCard video={video} />
                    {idx === 7 && (
                        <div className="col-span-full py-4">
                            <AdSenseBanner slotId="9999999999" />
                        </div>
                    )}
                </div>
                ))}
        </div>
      </div>
      
      {!loading && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-50">
             <div className="p-6 bg-white/5 rounded-full"><Sparkles size={40} /></div>
             <p className="font-black uppercase tracking-[0.3em] text-xs">Digital Void Encountered</p>
             <button onClick={() => navigate('/')} className="text-brand font-black text-[10px] hover:underline uppercase tracking-widest">Reset Discovery</button>
          </div>
      )}
    </div>
  );
};

export default Home;
