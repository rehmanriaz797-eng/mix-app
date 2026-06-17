
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bell, User, MonitorPlay, Shield, CreditCard } from 'lucide-react';

const Toggle = ({ label, description, checked, onChange }: { label: string, description?: string, checked: boolean, onChange: (val: boolean) => void }) => (
  <div className="flex justify-between items-start py-5 border-b border-yt-border/50">
    <div className="mr-8 flex-1">
      <div className="text-[15px] font-medium text-yt-text mb-1">{label}</div>
      {description && <div className="text-xs text-yt-textSec leading-relaxed">{description}</div>}
    </div>
    <div 
      className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors flex-shrink-0 ${checked ? 'bg-[#3ea6ff]' : 'bg-[#717171]'}`}
      onClick={() => onChange(!checked)}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${checked ? 'left-6' : 'left-1'}`} />
    </div>
  </div>
);

const Settings: React.FC = () => {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const activeTab = section || 'account';

  const [toggles, setToggles] = useState({
     desktop: true,
     subscriptions: true,
     recommended: true,
     activity: true,
     comments: true,
     mentions: true,
     shared: false
  });

  const handleToggle = (key: string) => {
      setToggles(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const menuItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'playback', label: 'Playback and performance', icon: MonitorPlay },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'billing', label: 'Billing and payments', icon: CreditCard },
  ];

  return (
    <div className="max-w-[1280px] mx-auto py-6 px-4 md:px-8 flex flex-col md:flex-row gap-0 md:gap-12 min-h-screen">
      {/* Settings Sidebar */}
      <div className="w-full md:w-56 flex-shrink-0 mb-6 md:mb-0">
        <h1 className="text-xl font-bold mb-6 px-3">Settings</h1>
        <div className="flex flex-col space-y-1">
           {menuItems.map(item => (
             <button 
               key={item.id}
               onClick={() => navigate(`/settings/${item.id}`)}
               className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-yt-spec text-white' : 'text-yt-textSec hover:text-white hover:bg-yt-hover'}`}
             >
               <item.icon size={22} strokeWidth={1.5} />
               {item.label}
             </button>
           ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-4xl">
         {activeTab === 'notifications' && (
             <div>
                <h2 className="text-lg font-bold mb-6">Notifications</h2>
                
                <div className="mb-8">
                    <h3 className="font-medium text-base mb-4">General</h3>
                    <div className="space-y-0">
                        <div className="py-4 border-b border-yt-border/50">
                            <h4 className="text-[15px] font-medium mb-1">Desktop notifications</h4>
                            <p className="text-xs text-yt-textSec mb-3">Get notifications in this browser</p>
                            <Toggle 
                                label="Allow notifications" 
                                description="Receive notifications on your desktop" 
                                checked={toggles.desktop}
                                onChange={() => handleToggle('desktop')}
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-medium text-base mb-4">Your preferences</h3>
                    <div className="space-y-0">
                        <Toggle 
                            label="Subscriptions" 
                            description="Notify me about activity from the channels I'm subscribed to" 
                            checked={toggles.subscriptions}
                            onChange={() => handleToggle('subscriptions')}
                        />
                        <Toggle 
                            label="Recommended videos" 
                            description="Notify me of videos I might like based on what I watch" 
                            checked={toggles.recommended}
                            onChange={() => handleToggle('recommended')}
                        />
                        <Toggle 
                            label="Activity on my channel" 
                            description="Notify me about comments and other activity on my channel or videos" 
                            checked={toggles.activity}
                            onChange={() => handleToggle('activity')}
                        />
                         <Toggle 
                            label="Replies to my comments" 
                            description="Notify me about replies to my comments" 
                            checked={toggles.comments}
                            onChange={() => handleToggle('comments')}
                        />
                         <Toggle 
                            label="Mentions" 
                            description="Notify me when others mention my channel" 
                            checked={toggles.mentions}
                            onChange={() => handleToggle('mentions')}
                        />
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-medium text-base mb-4">Email notifications</h3>
                    <div className="space-y-0">
                         <Toggle 
                            label="Send me emails about my YouTube activity" 
                            description="Only for essential updates, announcements, and personalized videos." 
                            checked={toggles.shared}
                            onChange={() => handleToggle('shared')}
                        />
                    </div>
                </div>
             </div>
         )}
         
         {activeTab === 'account' && (
             <div>
                 <h2 className="text-lg font-bold mb-6">Account</h2>
                 <div className="border-b border-yt-border/50 pb-6 mb-6">
                     <h3 className="font-medium text-base mb-2">Your Channel</h3>
                     <p className="text-sm text-yt-textSec mb-6">This represents your public presence on Azkaartube.</p>
                     
                     <div className="flex items-center gap-4">
                         <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-xl font-bold">A</div>
                         <div>
                             <div className="font-bold text-lg">Azkaartube User</div>
                             <div className="text-yt-textSec text-sm">@azkaartube_user • View channel</div>
                         </div>
                     </div>
                 </div>

                 <div className="space-y-6">
                     <div className="flex justify-between items-center hover:opacity-80 cursor-pointer">
                         <div className="text-blue-400 font-medium text-sm">Channel status and features</div>
                     </div>
                     <div className="flex justify-between items-center hover:opacity-80 cursor-pointer">
                         <div className="text-blue-400 font-medium text-sm">Create a new channel</div>
                     </div>
                     <div className="flex justify-between items-center hover:opacity-80 cursor-pointer">
                         <div className="text-blue-400 font-medium text-sm">View advanced settings</div>
                     </div>
                 </div>
             </div>
         )}

         {activeTab !== 'notifications' && activeTab !== 'account' && (
             <div>
                 <h2 className="text-lg font-bold mb-6 capitalize">{activeTab.replace('-', ' ')}</h2>
                 <p className="text-yt-textSec">Settings for {activeTab.replace('-', ' ')} are not implemented in this demo.</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default Settings;
