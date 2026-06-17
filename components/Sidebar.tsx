
import React from 'react';
import { 
  Home, Compass, PlaySquare, Clock, ThumbsUp, 
  User, Film, Music2, Gamepad2, Trophy, 
  Sparkles, Library, LogOut, Power 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    const confirmed = window.confirm("TERMINATE NEURAL SIGNAL?\n\nThis will decouple your account and clear local session data.");
    if (confirmed) {
      await signOut();
      navigate('/login');
    }
  };

  const MenuItem = ({ icon: Icon, label, path }: any) => {
    const isActive = path === '/' ? location.pathname === '/' : location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    
    return (
      <div 
        onClick={() => {
            if (path) navigate(path);
        }}
        className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${isActive ? 'bg-brand/10 text-brand font-bold border border-brand/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
      >
        <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-brand' : ''}`}>
          <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className="text-[13px] font-semibold">{label}</span>
      </div>
    );
  };

  return (
    <aside className={`
        sticky top-0 left-0 h-screen 
        bg-[#020617] border-r border-white/5 z-[60] transform transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] overflow-y-auto pb-20 lg:pb-6 relative
        ${isOpen ? 'w-72 translate-x-0 opacity-100 visible' : 'w-0 -translate-x-full opacity-0 invisible'}
    `}>
      {/* Dashed visual container */}
      <div className="absolute top-2 left-2 right-2 bottom-2 pointer-events-none border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-30"></div>

      <div className="px-4 py-8 space-y-1.5 border-b border-white/5 pb-6 relative z-10">
        <MenuItem icon={Home} label="Discover" path="/" />
        <MenuItem icon={Compass} label="Shorts" path="/shorts" />
        <MenuItem icon={PlaySquare} label="Subscriptions" path="/feed/subscriptions" />
        <MenuItem icon={Sparkles} label="Featured Trending" path="/feed/trending" />
      </div>
      
      <div className="px-4 py-6 space-y-1.5 border-b border-white/5 pb-6 relative z-10">
        <div className="px-4 mb-2 text-[11px] font-black uppercase tracking-widest text-slate-500">Your Hub</div>
        <MenuItem icon={Library} label="Your Library" path="/library" />
        <MenuItem icon={User} label="My Channel" path="/channel" />
        <MenuItem icon={Clock} label="History" path="/feed/history" />
        <MenuItem icon={Film} label="Content Studio" path="/studio" />
        <MenuItem icon={ThumbsUp} label="Liked Content" path="/feed/liked" />
      </div>

      <div className="px-4 py-6 space-y-1.5 relative z-10">
        <div className="px-4 mb-2 text-[11px] font-black uppercase tracking-widest text-slate-500">Explore Genres</div>
        <MenuItem icon={Music2} label="Music" path="/feed/music" />
        <MenuItem icon={Gamepad2} label="Gaming" path="/feed/gaming" />
        <MenuItem icon={Trophy} label="Sports" path="/feed/sports" />
      </div>

      {/* Unified Auth Control */}
      <div className="px-4 mt-10 relative z-10">
        {user ? (
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500/10 transition-all group mb-8"
          >
            <div className="flex items-center gap-4">
              <Power size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">Terminate Signal</span>
            </div>
            <LogOut size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-brand/10 border border-brand/20 text-brand hover:bg-brand hover:text-white transition-all group mb-8"
          >
            <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">Initiate Link</span>
          </button>
        )}
      </div>

      <div className="mt-auto px-8 py-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest relative z-10">
        <p className="hover:text-slate-400 cursor-pointer transition-colors mb-2">Policy • Terms • Press</p>
        <p className="font-medium text-slate-700">© 2025 Azkaartube Labs</p>
      </div>
    </aside>
  );
};

export default Sidebar;
