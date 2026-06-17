
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { SmartNotification } from '../types';

interface GlowBellProps {
    onClick: () => void;
}

const GlowBell: React.FC<GlowBellProps> = ({ onClick }) => {
    const [notifs, setNotifs] = useState<SmartNotification[]>(notificationService.getNotifications());
    const settings = notificationService.getSettings();
    
    useEffect(() => {
        const unsubscribe = notificationService.subscribe(setNotifs);
        return unsubscribe;
    }, []);

    const unreadCount = notifs.filter(n => !n.isRead).length;
    const hasHighPriority = notifs.some(n => !n.isRead && (n.priority === 'high' || n.priority === 'critical'));
    
    return (
        <button 
            onClick={onClick}
            className="relative group p-3 hover:bg-white/5 rounded-2xl transition-all duration-700 active:scale-90"
        >
            {/* Advanced Glow Aura */}
            {hasHighPriority && (
                <div className="absolute inset-0 rounded-2xl bg-brand/30 shadow-[0_0_35px_rgba(99,102,241,0.6)] scale-125 animate-pulse blur-md"></div>
            )}
            
            <div className={`absolute inset-0 rounded-2xl border transition-all duration-500 ${hasHighPriority ? 'border-brand shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'border-transparent'}`}></div>

            <div className="relative z-10">
                <Bell 
                    size={24} 
                    className={`transition-all duration-500 ${
                        hasHighPriority ? 'text-white scale-110' : 'text-slate-400 group-hover:text-white'
                    }`}
                    strokeWidth={hasHighPriority ? 2.5 : 2}
                />
                
                {unreadCount > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-xl text-[10px] font-black text-white border-2 border-[#020617] transition-all duration-700 ${
                        hasHighPriority ? 'bg-red-500 animate-bounce' : 'bg-brand'
                    }`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>
            
            {/* AI Experience Progress Under-Glow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-800 rounded-full overflow-hidden opacity-30 group-hover:opacity-100 transition-all duration-500">
                <div 
                    className="h-full bg-brand shadow-[0_0_10px_rgba(99,102,241,1)] transition-all duration-[2000ms] ease-out" 
                    style={{ width: `${settings.glowLevel}%` }}
                ></div>
            </div>
        </button>
    );
};

export default GlowBell;
