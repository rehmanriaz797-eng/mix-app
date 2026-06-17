
import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, BellOff, BellRing, UserMinus, Check, 
  ChevronDown, CheckCircle2 
} from 'lucide-react';
import { toggleSubscribe, isSubscribedTo, getNotifLevel, setNotifLevel, INITIAL_VIDEOS } from '../services/storageService';

interface SubscribeActionProps {
  channelName: string;
  className?: string;
  // Added 'channel' to support the channel page layout variant
  variant?: 'watch' | 'shorts' | 'channel';
}

const SubscribeAction: React.FC<SubscribeActionProps> = ({ channelName, className = "", variant = 'watch' }) => {
  const [handle, setHandle] = useState<string>('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifLevel, setNotifLevelState] = useState('all');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (!channelName) return;
      const video = INITIAL_VIDEOS.find(v => v.channelName === channelName);
      const h = video?.channelHandle || `@${channelName.toLowerCase().replace(/\s/g, '')}`;
      setHandle(h);
      setIsSubscribed(isSubscribedTo(h));
  }, [channelName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleSubUpdate = (e: any) => {
        if (e.detail.handle === handle) {
            setIsSubscribed(e.detail.isSubscribed);
        }
    };
    window.addEventListener('azkaartube_sub_update', handleSubUpdate);
    return () => window.removeEventListener('azkaartube_sub_update', handleSubUpdate);
  }, [handle]);

  const handleSubscribeClick = () => {
    if (!handle) return;
    if (!isSubscribed) {
      const nowSub = toggleSubscribe(handle);
      setIsSubscribed(nowSub);
      if (navigator.vibrate) navigator.vibrate(15);
    } else {
      setShowMenu(!showMenu);
    }
  };

  const updateNotif = (level: 'all' | 'personalized' | 'none') => {
    if (!channelName) return;
    setNotifLevel(channelName, level);
    setNotifLevelState(level);
    setShowMenu(false);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleUnsubscribe = () => {
    if (!handle) return;
    toggleSubscribe(handle);
    setIsSubscribed(false);
    setShowMenu(false);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const getBellIcon = () => {
    if (notifLevel === 'all') return <BellRing size={18} className="text-white" />;
    if (notifLevel === 'none') return <BellOff size={18} className="text-slate-400" />;
    return <Bell size={18} className="text-white" />;
  };

  if (variant === 'shorts') {
    return (
      <div className="relative inline-block">
        <button 
          onClick={handleSubscribeClick}
          className={`pointer-events-auto px-6 h-10 rounded-full text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 border shadow-2xl active:scale-95 ${
            isSubscribed 
            ? 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20' 
            : 'bg-white text-black hover:bg-slate-100'
          }`}
        >
          {isSubscribed ? (
            <>
              {getBellIcon()}
              <span>SUBSCRIBED</span>
            </>
          ) : (
            'SUBSCRIBE'
          )}
        </button>
        {showMenu && (
          <MenuOverlay 
            menuRef={menuRef} 
            activeLevel={notifLevel} 
            onSelect={updateNotif} 
            onUnsubscribe={handleUnsubscribe} 
            position="bottom-full mb-4 left-0"
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button 
        onClick={handleSubscribeClick}
        className={`h-12 px-8 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all flex items-center gap-3 border shadow-2xl ${
          isSubscribed 
          ? 'bg-[#0f111a] text-slate-300 border-white/5 hover:bg-white/5' 
          : 'bg-brand text-white border-brand/20 shadow-brand/20 hover:bg-brand-600'
        } ${className}`}
      >
        {isSubscribed && getBellIcon()}
        <span>{isSubscribed ? 'Subscribed' : 'Join Community'}</span>
        {isSubscribed && <ChevronDown size={14} className={`transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`} />}
      </button>

      {showMenu && (
        <MenuOverlay 
          menuRef={menuRef} 
          activeLevel={notifLevel} 
          onSelect={updateNotif} 
          onUnsubscribe={handleUnsubscribe} 
          position="top-full mt-3 left-0"
        />
      )}
    </div>
  );
};

const MenuOverlay = ({ menuRef, activeLevel, onSelect, onUnsubscribe, position }: any) => (
  <div 
    ref={menuRef}
    className={`absolute ${position} z-[1000] min-w-[240px] bg-[#0d0d0d] border border-white/10 rounded-[1.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.9)] py-3 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200 pointer-events-auto`}
  >
    <Option 
      icon={BellRing} 
      label="All" 
      isActive={activeLevel === 'all'} 
      onClick={() => onSelect('all')} 
    />
    <Option 
      icon={Bell} 
      label="Personalized" 
      isActive={activeLevel === 'personalized'} 
      onClick={() => onSelect('personalized')} 
    />
    <Option 
      icon={BellOff} 
      label="None" 
      isActive={activeLevel === 'none'} 
      onClick={() => onSelect('none')} 
    />
    <div className="h-[1px] bg-white/5 my-2 mx-2" />
    <Option 
      icon={UserMinus} 
      label="Unsubscribe" 
      isActive={false} 
      onClick={onUnsubscribe} 
      isDanger
    />
  </div>
);

const Option = ({ icon: Icon, label, isActive, onClick, isDanger }: any) => (
  <button 
    onClick={(e) => {
        e.stopPropagation();
        onClick();
    }}
    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group text-left"
  >
    <div className="flex items-center gap-4">
      <Icon size={18} className={`${isDanger ? 'text-red-500' : isActive ? 'text-white' : 'text-slate-500'} group-hover:scale-110 transition-transform`} />
      <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${isDanger ? 'text-red-500' : 'text-white'}`}>{label}</span>
    </div>
    {isActive && <Check size={14} className="text-white opacity-40" />}
  </button>
);

export default SubscribeAction;
