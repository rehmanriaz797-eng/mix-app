import React from 'react';
import {
  MonitorPlay,
  Film,
  ShoppingBag,
  Sparkles,
  Crown
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface SuperSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const SuperSidebar: React.FC<SuperSidebarProps> = ({ isExpanded, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const apps = [
    { id: 'watch', icon: MonitorPlay, label: 'WATCH', path: '/' },
    { id: 'reels', icon: Film, label: 'REELS', path: '/reels' },
    { id: 'marketplace', icon: ShoppingBag, label: 'SHOP', path: '/marketplace' },
    { id: 'ai', icon: Sparkles, label: 'AICHAT', path: '/ai-chat' }
  ];

  const isPremium = profile?.is_premium;
  const isPremiumPath = location.pathname === '/premium';

  return (
    <>
      <div 
        className={`fixed md:sticky top-0 left-0 z-[150] h-screen bg-black flex flex-col items-center py-6 gap-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 overflow-y-auto scrollbar-hide overflow-x-hidden w-[88px] border-r border-white/5
        `}
      >
        {/* Dashed Border Visual Overlay matching screenshot */}
        <div className="absolute top-2 left-2 right-2 bottom-2 pointer-events-none border-2 border-dashed border-brand/20 rounded-[2rem] opacity-40"></div>

        <div
          onClick={() => navigate('/')}
          className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-2xl shadow-brand/30 cursor-pointer hover:scale-110 transition shrink-0 relative z-10"
        >
          AT
        </div>

        <div className="flex flex-col gap-8 w-full px-2 mt-4 relative z-10">
          {apps.map(app => {
            const Icon = app.icon;
            const isActive =
              location.pathname === app.path ||
              (app.id !== 'watch' && (location.pathname.startsWith(app.path) || (app.id === 'reels' && location.pathname === '/shorts')));

            return (
              <div
                key={app.id}
                onClick={() => {
                    navigate(app.path);
                }}
                className={`flex flex-col items-center gap-1.5 cursor-pointer group transition ${
                  isActive ? 'text-brand' : 'text-slate-500 hover:text-white'
                }`}
              >
                <div
                  className={`p-3 rounded-[1.25rem] transition ${
                    isActive
                      ? 'bg-brand/15 shadow-xl shadow-brand/20 border border-brand/20'
                      : 'group-hover:bg-white/5'
                  }`}
                >
                  <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[9px] font-black tracking-[0.1em] opacity-80 uppercase text-center">
                  {app.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col items-center gap-6 pb-4 relative z-10">
          <button
            onClick={() => navigate('/premium')}
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition relative ${
              isPremiumPath
                ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50 shadow-[0_0_25px_rgba(234,179,8,0.5)]'
                : isPremium
                ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                : 'text-slate-500 bg-white/5 border-white/10 hover:text-yellow-400'
            }`}
          >
            <Crown size={24} fill={(isPremium || isPremiumPath) ? 'currentColor' : 'none'} />
          </button>

          <div
            onClick={() => navigate('/channel')}
            className={`w-10 h-10 rounded-full overflow-hidden ring-2 transition shadow-xl cursor-pointer ${
              isPremium ? 'ring-yellow-400 shadow-yellow-500/40 scale-105' : 'ring-white/10 hover:ring-brand'
            }`}
          >
            <img
              src={profile?.avatar_url || 'https://picsum.photos/100'}
              className="w-full h-full object-cover"
              alt="Profile"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperSidebar;