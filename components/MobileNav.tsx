
import React from 'react';
import { Home, Compass, Plus, Users, Library } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'home', icon: Home, label: 'Home', path: '/' },
        { id: 'shorts', icon: Compass, label: 'Shorts', path: '/shorts' },
        { id: 'upload', icon: Plus, label: '', path: '/upload', special: true },
        { id: 'subs', icon: Users, label: 'Subs', path: '/feed/subscriptions' },
        { id: 'library', icon: Library, label: 'Library', path: '/library' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 inset-x-0 h-[72px] bg-black/90 backdrop-blur-2xl border-t border-white/5 z-[200] flex items-center justify-around px-2 pb-safe">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
                
                if (tab.special) {
                    return (
                        <button 
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center -mt-6 shadow-2xl shadow-brand/40 active:scale-90 transition-transform"
                        >
                            <Icon size={24} className="text-black" />
                        </button>
                    );
                }

                return (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className={`flex flex-col items-center gap-1 flex-1 transition-all ${isActive ? 'text-brand' : 'text-slate-500'}`}
                    >
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default MobileNav;
