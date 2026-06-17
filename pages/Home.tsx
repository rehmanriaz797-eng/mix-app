import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { getVideos, INITIAL_SHORTS } from '../services/storageService';
import { Video, SortShort } from '../types';
import AdSenseBanner from '../components/AdSenseBanner';
import { 
    Sparkles, Coffee, Brain, Laugh, Zap, Target, 
    TrendingUp, Users, Compass, ChevronRight, ChevronLeft, X,
    Gamepad2, Music2, Radio, Code2, Rocket, Camera, Trophy, Map,
    Loader2
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  const isMobile = windowWidth < 640;
  const shortsInterval = isMobile ? 15 : 35; 

  // Handle live resizing to ensure correct item counts
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

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
    setVideos([]);
    setPage(0);
    setHasMore(true);
  }, [category, activeTab, location.pathname]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (page === 0) setLoading(true);
      else setLoadingMore(true);
      
      try {
          let filter = 'All';
          if (isTrending) filter = 'trending';
          else if (isSubscriptions) filter = 'subscriptions';
          else if (isHistory) filter = 'History';
          else if (isLiked) filter = 'liked';
          else if (category) filter = category.replace(/-/g, ' ');
          else if (activeTab !== 'all') filter = activeTab;

          const fetchedVideos = await getVideos(filter, page);
          
          if (isMounted) {
              if (page === 0) {
                  setVideos(fetchedVideos);
                  setShorts(INITIAL_SHORTS);
                  setLoading(false);
              } else {
                  setVideos(prev => [...prev, ...fetchedVideos]);
                  setLoadingMore(false);
                  if (page > 10) setHasMore(false);
              }
          }
      } catch (e) {
          console.error(e);
          if (isMounted) {
            setLoading(false);
            setLoadingMore(false);
          }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [category, activeTab, location.pathname, page]);

  const ShortsShelf = () => {
    // Mobile (<640px): 2 items. Tablet/Desktop: 6 items.
    const visibleShorts = isMobile ? shorts.slice(0, 2) : shorts.slice(0, 6);

    return (
        <div className="col-span-full py-12 mb-12 relative group/shelf">
            {/* Dashed Border Visual Match */}
            <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] pointer-events-none -m-1"></div>
            
            <div className="px-6 md:px-10 mb-10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-600/40">
                        <Compass size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic">Shorts</h2>
                        <p className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Trending Quick Bites</p>
                    </div>
                </div>
                <button 
                  onClick={() => navigate('/shorts')} 
                  className="px-6 md:px-8 py-3 md:py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-3 active:scale-95"
                >
                    VIEW ALL <ChevronRight size={16} />
                </button>
            </div>
            
            {/* Grid layout to "fully cover" the row area. 2 cols on mobile, 6 cols on tablet/desktop. */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-5 px-6 md:px-10 relative z-10">
                {visibleShorts.map((short) => (
                    <div 
                      key={short.id} 
                      onClick={() => navigate(`/shorts/${short.id}`)}
                      className="aspect-[9/16] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative group cursor-pointer bg-slate-900 border border-white/5 hover:border-brand/50 transition-all duration-700 shadow-2xl hover:-translate-y-3"
                    >
                        <img src={short.thumbnail_url} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" alt={short.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="absolute bottom-6 md:bottom-8 left-4 md:left-6 right-4 md:right-6">
                            <h3 className="text-white text-[11px] md:text-sm font-black line-clamp-2 leading-tight drop-shadow-lg mb-1 md:mb-2 uppercase italic tracking-tighter">{short.title}</h3>
                            <p className="text-[8px] md:text-[10px] font-black text-white/50 uppercase tracking-widest">{short.likes_count.toLocaleString()} VIEWS</p>
                        </div>
                        
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100">
                            <div className="p-4 md:p-6 bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 shadow-2xl">
                                <Zap className="text-white fill-white" size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const shouldShowShorts = activeTab === 'all' && !category && !isTrending && !isSubscriptions && !isHistory && !isLiked && shorts.length > 0;

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface-100 pb-24 font-sans animate-in fade-in duration-1000">
      
      {!isHistory && !isLiked && (
        <div className="sticky top-0 z-30 bg-surface-100/90 backdrop-blur-2xl border-b border-white/5 h-[64px] flex items-center px-4 md:px-6">
           <div className="relative w-full flex items-center overflow-hidden">
               
               {showLeftArrow && (
                   <div className="absolute left-0 inset-y-0 z-10 flex items-center bg-gradient-to-r from-surface-100 via-surface-100 to-transparent pr-12">
                       <button onClick={() => scroll('left')} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all border border-white/5 active:scale-90"><ChevronLeft size={20}/></button>
                   </div>
               )}

               <div ref={scrollRef} onScroll={handleScroll} className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide px-2 w-full transition-all duration-300">
                   <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mr-2 border-r border-white/10 pr-4 hidden md:block shrink-0">FILTER FEED</div>
                   {CATEGORIES.map(cat => (
                       <button
                          key={cat.id}
                          onClick={() => {
                              setActiveTab(cat.id);
                              if (cat.id === 'all') navigate('/');
                              else navigate(`/feed/${cat.id}`);
                          }}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shrink-0 ${
                              (activeTab === cat.id || category === cat.id)
                              ? 'bg-brand border-brand text-white shadow-xl shadow-brand/20 scale-[1.05]' 
                              : 'bg-white/5 text-slate-400 hover:text-white border-white/5 hover:bg-white/10'
                          }`}
                       >
                          <cat.icon size={14} />
                          {cat.label}
                       </button>
                   ))}
                   <div className="w-10 shrink-0"></div>
               </div>

               {showRightArrow && (
                   <div className="absolute right-0 inset-y-0 z-10 flex items-center bg-gradient-to-l from-surface-100 via-surface-100 to-transparent pl-12">
                       <button onClick={() => scroll('right')} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all border border-white/5 active:scale-90"><ChevronRight size={20}/></button>
                   </div>
               )}
           </div>
        </div>
      )}

      <div className="p-4 md:p-6 lg:px-10">
        {(isTrending || isSubscriptions || isHistory || isLiked) && (
            <div className="flex items-center gap-3 mb-10 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-lg border border-brand/20">
                    {isTrending ? <TrendingUp size={24} /> : <Users size={24} />}
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">{getPageTitle()}</h2>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-8 gap-y-12 md:gap-y-20">
            {loading && videos.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-4 animate-pulse px-2">
                    <div className="aspect-video bg-slate-900 rounded-[2.5rem]"></div>
                    <div className="flex gap-4 px-2">
                        <div className="w-10 h-10 rounded-[1.25rem] bg-slate-900 shrink-0"></div>
                        <div className="space-y-2 w-full">
                            <div className="h-3.5 bg-slate-900 rounded w-3/4"></div>
                            <div className="h-2.5 bg-slate-900 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
              ))
            : videos.map((video, idx) => (
                <React.Fragment key={video.id}>
                    {idx === 0 && shouldShowShorts && (
                        <ShortsShelf />
                    )}

                    <div 
                        ref={idx === videos.length - 1 ? lastElementRef : null}
                        className="animate-in fade-in slide-in-from-bottom-8 duration-1000" 
                        style={{ animationDelay: `${(idx % 12) * 30}ms`, animationFillMode: 'both' }}
                    >
                        <VideoCard video={video} />
                    </div>

                    {idx > 0 && (idx + 1) % shortsInterval === 0 && shouldShowShorts && (
                        <ShortsShelf />
                    )}

                    {idx === 7 && (
                        <div className="col-span-full py-10">
                            <AdSenseBanner slotId="9999999999" />
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
        
        {loadingMore && (
            <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-50">
                 <Loader2 size={40} className="text-brand animate-spin" />
                 <p className="font-black uppercase tracking-[0.6em] text-[11px] text-slate-500 animate-pulse">Synchronizing Next Neural Batch...</p>
            </div>
        )}
      </div>
      
      {!loading && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-48 gap-8 opacity-40">
             <div className="p-12 bg-white/5 rounded-full border border-white/5 animate-pulse shadow-2xl"><Sparkles size={80} /></div>
             <div className="text-center space-y-3">
                 <p className="font-black uppercase tracking-[0.5em] text-lg text-white">Neural signal lost</p>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Recalibrate discovery parameters to resume broadcast.</p>
             </div>
             <button onClick={() => { setActiveTab('all'); navigate('/'); }} className="mt-4 px-10 py-4 bg-brand text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-brand/40 hover:scale-105 active:scale-95 transition-all">Re-Establish Connection</button>
          </div>
      )}
    </div>
  );
};

export default Home;