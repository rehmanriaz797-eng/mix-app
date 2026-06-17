
import React, { useState, useEffect, useRef } from 'react';
import { 
    Mic, Plus, LogIn, LayoutGrid, Play, Search, 
    Bell, X, Loader2, Settings, Video, Film, MessageSquare,
    ChevronRight, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GlowBell from './GlowBell';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarExpanded: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarExpanded }) => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  
  const createMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/results?search_query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition;
    if (!SpeechRecognition) {
      alert("Neural Voice Protocol not supported.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      navigate(`/results?search_query=${encodeURIComponent(transcript)}`);
    };
    recognition.start();
  };

  return (
    <header className="sticky top-0 z-[100] flex items-center justify-between bg-[#020617] px-8 h-[80px] w-full border-b border-white/5 backdrop-blur-xl bg-opacity-95">
        <div className="flex items-center gap-6">
          <button 
            onClick={(e) => {
                e.preventDefault();
                toggleSidebar();
            }} 
            className={`relative p-3 transition-all duration-300 rounded-xl group overflow-hidden
              ${isSidebarExpanded ? 'bg-white/5' : 'hover:bg-white/5'}
            `}
          >
            <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <LayoutGrid size={24} className={`${isSidebarExpanded ? 'text-brand' : 'text-slate-400 group-hover:text-white'} transition-colors relative z-10`} />
          </button>

          <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer group ml-2">
            <div className="w-11 h-8 bg-[#6366f1] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-all duration-500">
                <Play size={22} fill="white" className="text-white ml-0.5" />
            </div>
            <span className="hidden sm:block text-2xl font-black text-white tracking-tighter uppercase italic">
              Azkaar<span className="text-brand">Tube</span>
            </span>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-[650px] items-center mx-12">
          <form onSubmit={handleSearch} className="flex flex-1 items-center bg-[#0d1117] border border-white/10 rounded-[1.5rem] focus-within:border-brand/40 focus-within:ring-4 focus-within:ring-brand/5 transition-all overflow-hidden px-8 py-3.5 relative group shadow-inner">
            <input
              type="text"
              placeholder="Query the neural network..."
              className="w-full bg-transparent pr-12 outline-none text-white text-sm font-bold placeholder-slate-600 tracking-wide"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-5 flex items-center gap-2">
                {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="text-slate-600 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                )}
                <button 
                    type="button" 
                    onClick={startVoiceSearch}
                    className={`p-2 rounded-xl transition-all ${isListening ? 'bg-brand text-white animate-pulse shadow-lg shadow-brand/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                >
                    {isListening ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
                </button>
                <div className="w-px h-6 bg-white/10 mx-2"></div>
                <button type="submit" className="text-slate-500 hover:text-brand transition-colors">
                    <Search size={20} />
                </button>
            </div>
          </form>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4 relative">
              
              {/* CREATE ACTION HUB */}
              <div className="relative" ref={createMenuRef}>
                  <button 
                    onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)} 
                    className={`group relative w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-500 shadow-xl active:scale-90 ${isCreateMenuOpen ? 'bg-brand border-brand rotate-[135deg] scale-110' : 'bg-brand/10 border-brand/20 hover:bg-brand hover:border-brand'}`}
                    title="Initiate Broadcast"
                  >
                    {!isCreateMenuOpen && <div className="absolute inset-0 bg-brand blur-xl opacity-0 group-hover:opacity-40 transition-opacity"></div>}
                    <Plus size={24} className={`${isCreateMenuOpen ? 'text-white' : 'text-brand group-hover:text-white'} transition-colors`} strokeWidth={3} />
                  </button>

                  {/* Dropdown Menu */}
                  {isCreateMenuOpen && (
                      <div className="absolute top-full right-0 mt-4 w-72 bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,1)] overflow-hidden z-[200] animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
                          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Broadcast Mode</p>
                          </div>
                          
                          <div className="p-2">
                              <CreateOption 
                                icon={Video} 
                                label="Upload Video" 
                                sub="Long-form signal sync" 
                                color="text-brand"
                                onClick={() => { navigate('/upload'); setIsCreateMenuOpen(false); }} 
                              />
                              <CreateOption 
                                icon={Film} 
                                label="Upload Shorts" 
                                sub="High velocity quick bites" 
                                color="text-red-500"
                                onClick={() => { navigate('/upload'); setIsCreateMenuOpen(false); }} 
                              />
                              <CreateOption 
                                icon={MessageSquare} 
                                label="Create Post" 
                                sub="Community resonance update" 
                                color="text-emerald-500"
                                onClick={() => { navigate('/studio?tab=community'); setIsCreateMenuOpen(false); }} 
                              />
                          </div>

                          <div className="p-6 bg-brand/5 border-t border-white/5">
                              <div className="flex items-center gap-2 text-[9px] font-black text-brand/60 uppercase tracking-widest">
                                  <Zap size={10} fill="currentColor" /> Neural Ingestion Active
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              <GlowBell onClick={() => setShowNotifs(!showNotifs)} />
              
              <button 
                onClick={() => navigate('/settings')}
                className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl border border-white/5 transition-all active:scale-90"
              >
                <Settings size={22} />
              </button>

              <button onClick={() => navigate('/channel')} className="w-12 h-12 rounded-[1.25rem] overflow-hidden border-2 border-white/10 hover:border-brand transition-all shadow-2xl bg-slate-800 ring-4 ring-white/5">
                <img src={profile?.avatar_url || 'https://picsum.photos/100'} className="w-full h-full object-cover transition-all" />
              </button>
            </div>
          ) : (
            <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-3 border border-white/10 bg-white/5 text-slate-300 px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand hover:text-white hover:border-brand transition-all shadow-xl"
            >
                <LogIn size={16} /> INITIATE LINK
            </button>
          )}
        </div>

        {showNotifs && <NotificationCenter onClose={() => setShowNotifs(false)} />}
    </header>
  );
};

const CreateOption = ({ icon: Icon, label, sub, color, onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-5 p-5 hover:bg-white/5 transition-all rounded-[1.75rem] group"
    >
        <div className={`p-4 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors ${color}`}>
            <Icon size={22} />
        </div>
        <div className="text-left flex-1">
            <h4 className="text-white font-black text-[13px] uppercase tracking-tight italic group-hover:text-brand transition-colors">{label}</h4>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">{sub}</p>
        </div>
        <ChevronRight size={16} className="text-slate-800 group-hover:text-white transition-all transform group-hover:translate-x-1" />
    </button>
);

export default Header;
