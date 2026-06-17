
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Bell, User, MonitorPlay, Shield, CreditCard, 
    Smartphone, Mail, Check, Power, LogOut, Loader2,
    Activity, Zap, Sparkles, ChevronRight, Eye, Lock, 
    Database, Trash2, ArrowUpRight, X, Volume2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { updateUserChannel } from '../services/storageService';

const Settings: React.FC = () => {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const { profile, setProfile, signOut } = useAuth();
  const activeTab = section || 'account';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editUsername, setEditUsername] = useState(profile?.username || '');

  const menuItems = [
    { id: 'account', label: 'ACCOUNT', icon: User },
    { id: 'notifications', label: 'NOTIFICATIONS', icon: Bell },
    { id: 'playback', label: 'PLAYBACK', icon: MonitorPlay },
    { id: 'privacy', label: 'PRIVACY', icon: Shield },
    { id: 'billing', label: 'PAYMENTS', icon: CreditCard },
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    await updateUserChannel({ name: editName, handle: `@${editUsername}` });
    setProfile({ ...profile, full_name: editName, username: editUsername });
    setIsEditModalOpen(false);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  /**
   * AUTHORIZED SIGNAL TERMINATION
   * Triggers the neural decoupling sequence and redirects to the login portal.
   */
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSigningOut) return;
    
    const confirmed = window.confirm("TERMINATE NEURAL SIGNAL?\n\nThis will decouple your account and clear local session data.");
    
    if (confirmed) {
        setIsSigningOut(true);
        if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
        
        try {
            await signOut();
        } catch (error) {
            console.error("Link termination failure:", error);
            // Emergency fallback redirect
            window.location.href = '/#/login';
            window.location.reload();
        }
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto py-12 px-8 md:px-16 flex flex-col md:flex-row gap-16 min-h-screen animate-in fade-in duration-500 font-sans select-none overflow-x-hidden">
      
      {/* Sidebar - SYSTEM PROTOCOL */}
      <div className="w-full md:w-72 flex-shrink-0">
        <div className="flex items-center gap-3 mb-10 px-4">
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse shadow-[0_0_15px_#6366f1]"></div>
            <h1 className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-500 italic">SYSTEM PROTOCOL</h1>
        </div>

        <div className="flex flex-col space-y-4">
           {menuItems.map(item => (
             <button 
               key={item.id}
               onClick={() => navigate(`/settings/${item.id}`)}
               className={`group flex items-center justify-between px-8 py-5 rounded-[1.75rem] transition-all duration-300 relative border border-transparent ${
                 activeTab === item.id 
                 ? 'bg-brand/10 text-white shadow-[0_0_50px_rgba(99,102,241,0.1)] border-brand/20' 
                 : 'text-slate-500 hover:text-white hover:bg-white/5'
               }`}
             >
               <div className="flex items-center gap-5">
                  <item.icon size={22} className={activeTab === item.id ? 'text-brand' : 'group-hover:text-white transition-colors'} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                  <span className={`text-[13px] font-black uppercase tracking-[0.2em] ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>{item.label}</span>
               </div>
               {activeTab === item.id && (
                   <div className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_12px_#6366f1]"></div>
               )}
             </button>
           ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl relative z-10">
         
         {activeTab === 'account' && (
             <div className="animate-in slide-in-from-right-4 duration-500">
                 <div className="mb-16">
                    <h2 className="text-[52px] font-black text-white uppercase italic tracking-tighter leading-none mb-4">ACCOUNT NODE</h2>
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] italic">IDENTITY AND PUBLIC RESONANCE</p>
                 </div>
                 
                 <div className="bg-white/[0.02] border border-white/5 rounded-[4rem] p-12 mb-12 shadow-2xl relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-40"></div>
                     <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                         <div className="relative shrink-0">
                            <img 
                                src={profile?.avatar_url || 'https://picsum.photos/seed/guest/200'} 
                                className="w-40 h-40 rounded-[3rem] object-cover border-[10px] border-[#020617] shadow-2xl transition-all group-hover:scale-105 duration-1000" 
                                alt=""
                            />
                            <div className="absolute -bottom-2 -right-2 bg-brand p-2.5 rounded-2xl shadow-xl border-4 border-[#020617]">
                                <Check size={18} className="text-white" strokeWidth={4} />
                            </div>
                         </div>
                         <div className="flex-1 text-center lg:text-left">
                             <div className="text-[40px] font-black text-white uppercase italic tracking-tighter leading-tight mb-3 group-hover:text-brand transition-colors duration-500">
                                {profile?.full_name || 'NEURAL GUEST'}
                             </div>
                             <div className="text-[14px] font-black text-brand uppercase tracking-[0.4em] mb-10 opacity-70 italic">
                                @{profile?.username?.toUpperCase() || 'GUESTLINK'}
                             </div>
                             <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                                 <button onClick={() => navigate('/channel')} className="px-10 py-4 bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-brand hover:text-white transition-all shadow-2xl active:scale-95 flex items-center gap-3">VIEW CHANNEL</button>
                                 <button onClick={() => setIsEditModalOpen(true)} className="px-10 py-4 bg-white/5 border border-white/10 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all active:scale-95">EDIT IDENTITY</button>
                             </div>
                         </div>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                     <LedgerActionCard 
                        icon={Smartphone} 
                        label="MANAGE GOOGLE ACCOUNT" 
                        sub="SECURITY AND GLOBAL SYNC" 
                        onClick={() => window.open('https://myaccount.google.com/', '_blank')} 
                     />
                     <LedgerActionCard 
                        icon={Mail} 
                        label="CONTACT PREFERENCES" 
                        sub="BROADCAST FREQUENCY" 
                        onClick={() => navigate('/settings/notifications')} 
                     />
                 </div>

                 {/* TERMINATE SIGNAL (SIGN OUT) - ACTIVE BUTTON */}
                 <div className="relative group/signout">
                    <div className="absolute inset-[-12px] border-2 border-dashed border-red-800/40 rounded-[4rem] pointer-events-none group-hover/signout:border-red-500/60 transition-colors duration-500"></div>
                    
                    <button 
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="w-full flex items-center justify-between p-10 bg-[#05081a] border border-white/5 rounded-[3.5rem] hover:bg-[#0a0f26] transition-all text-red-500 font-black group shadow-2xl relative overflow-hidden active:scale-[0.99] disabled:opacity-50"
                    >
                        <div className="flex items-center gap-8 relative z-10">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-red-500 border border-red-500/20 group-hover:scale-110 group-hover:bg-red-500/10 transition-all duration-500 ${isSigningOut ? 'animate-pulse' : ''}`}>
                                {isSigningOut ? <Loader2 size={32} className="animate-spin" /> : <Power size={32} strokeWidth={2.5} />}
                            </div>
                            <div className="text-left">
                                <h4 className="text-[22px] uppercase tracking-[0.3em] italic mb-1 group-hover:text-red-400 transition-colors">
                                    {isSigningOut ? 'TERMINATING...' : 'TERMINATE SIGNAL'}
                                </h4>
                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] opacity-80">(SIGN OUT PROTOCOL)</p>
                            </div>
                        </div>
                        <LogOut size={24} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all relative z-10" />
                        
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-500/5 blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                 </div>
             </div>
         )}

         {activeTab === 'notifications' && (
             <div className="animate-in slide-in-from-right-4 duration-500">
                 <div className="mb-16">
                    <h2 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.6em] italic mb-12">NOTIFICATION PROTOCOLS</h2>
                 </div>
                 <div className="space-y-6">
                    <ProtocolToggle icon={Bell} label="BROADCAST ALERTS" sub="NOTIFY ON CHANNEL UPDATES AND LIVE SIGNALS" defaultChecked />
                    <ProtocolToggle icon={Sparkles} label="AI RECOMMENDATIONS" sub="SIGNALS MATCHED TO YOUR NEURAL INTEREST GRAPH" defaultChecked />
                    <ProtocolToggle icon={Activity} label="ACTIVITY PULSE" sub="NOTIFY ON LIKES AND COMMENTS OF YOUR TRANSMISSIONS" />
                    <ProtocolToggle icon={Zap} label="PRIORITY BURSTS" sub="URGENT PLATFORM UPDATES AND VIP MENTIONS" defaultChecked />
                 </div>
             </div>
         )}

         {activeTab === 'playback' && (
             <div className="animate-in slide-in-from-right-4 duration-500">
                 <div className="mb-16">
                    <h2 className="text-[52px] font-black text-white uppercase italic tracking-tighter leading-none mb-4">ENGINE PROTOCOL</h2>
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] italic">PLAYBACK PERFORMANCE TUNING</p>
                 </div>
                 <div className="space-y-6">
                    <SettingsToggle icon={Zap} label="Stable Volume" sub="Automatic gain control for consistent neural audio" defaultChecked />
                    <SettingsToggle icon={Sparkles} label="Ambient Mode" sub="Soft glow projection from video transmissions" defaultChecked />
                    {/* Fix: Volume2 icon was missing from lucide-react imports */}
                    <SettingsToggle icon={Volume2} label="Hi-Fi Transmission" sub="Uncompressed high-bitrate audio stream" defaultChecked />
                    <SettingsToggle icon={Activity} label="Auto-HDR Up-scaling" sub="Convert standard signals to high dynamic range" />
                    <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] mt-10">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">DEFAULT BITRATE</span>
                            <span className="text-brand font-black">4K ULTRA</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-brand w-[85%]"></div>
                        </div>
                    </div>
                 </div>
             </div>
         )}

         {activeTab === 'privacy' && (
             <div className="animate-in slide-in-from-right-4 duration-500">
                 <div className="mb-16">
                    <h2 className="text-[52px] font-black text-white uppercase italic tracking-tighter leading-none mb-4">SHIELD PROTOCOL</h2>
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] italic">DATA AND SIGNAL PROTECTION</p>
                 </div>
                 <div className="space-y-6">
                    <SettingsToggle icon={Eye} label="Stealth Mode" sub="Browse transmissions without leaving neural footprints" />
                    <SettingsToggle icon={Lock} label="End-to-End Encryption" sub="Secure all direct node-to-node signals" defaultChecked />
                    <SettingsToggle icon={Database} label="Neural History Sync" sub="Store your watch history in the cloud node" defaultChecked />
                    <button className="w-full flex items-center justify-between p-8 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] hover:bg-red-500/10 transition-all text-red-400 font-black text-[11px] uppercase tracking-[0.3em]">
                        <div className="flex items-center gap-4"><Trash2 size={20}/> PURGE ALL LOCAL NODE DATA</div>
                        <ChevronRight size={18}/>
                    </button>
                 </div>
             </div>
         )}

         {activeTab === 'billing' && (
             <div className="animate-in slide-in-from-right-4 duration-500">
                 <div className="mb-16">
                    <h2 className="text-[52px] font-black text-white uppercase italic tracking-tighter leading-none mb-4">LEDGER NODE</h2>
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] italic">PAYMENTS AND WALLET SYNC</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                     <div className="absolute inset-[-20px] border-2 border-dashed border-red-800/40 rounded-[4rem] pointer-events-none -z-10"></div>
                     <LedgerActionCard icon={CreditCard} label="PAYMENT METHODS" sub="SYNC CARDS OR WALLETS" onClick={() => alert("Redirecting to gateway...")} />
                     <LedgerActionCard icon={Sparkles} label="ACTIVE SUBSCRIPTIONS" sub="NEURAL PREMIUM: ELITE" onClick={() => navigate('/premium')} />
                     <LedgerActionCard icon={Zap} label="TRANSACTION LOG" sub="LEDGER HISTORY RECAP" onClick={() => alert("History loading...")} />
                     <LedgerActionCard icon={Smartphone} label="EASYPAISA SYNC" sub="LOCAL NODE WITHDRAWALS" onClick={() => alert("JazzCash/EP enabled.")} />
                 </div>
             </div>
         )}

         <div className="mt-32 pt-12 border-t border-white/5 text-center flex flex-col items-center gap-6 opacity-30">
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[1.2em] italic">NEURAL CORE FRAMEWORK V4.0.2</p>
         </div>
      </div>

      {/* Edit Identity Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-[#05081a] w-full max-w-xl rounded-[4rem] shadow-[0_0_150px_rgba(0,0,0,1)] border border-white/5 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center p-10 border-b border-white/5 bg-white/5">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">Sync Persona</h2>
                    <button onClick={() => setIsEditModalOpen(false)} className="p-4 hover:bg-white/10 rounded-[1.75rem] transition-all"><X size={32} /></button>
                </div>
                <div className="p-12 overflow-y-auto scrollbar-hide">
                    <form onSubmit={handleUpdateProfile} className="space-y-12">
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] ml-4">Neural Identity Label</label>
                            <input className="w-full bg-black border border-white/10 rounded-2xl p-7 focus:border-brand outline-none text-white font-black text-2xl transition-all shadow-inner italic" value={editName} onChange={e => setEditName(e.target.value)} placeholder="DISPLAY_NAME" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] ml-4">Neural Signal Handle (@)</label>
                            <input className="w-full bg-black border border-white/10 rounded-2xl p-7 focus:border-brand outline-none text-white font-black text-2xl transition-all shadow-inner italic" value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="choosen_id" />
                        </div>
                        <div className="flex justify-end gap-6 pt-6">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-10 py-5 text-[12px] font-black text-slate-600 uppercase tracking-[0.4em] hover:text-white transition-all italic">Abort</button>
                            <button type="submit" className="px-14 py-5 bg-brand text-white font-black rounded-3xl text-[12px] uppercase tracking-[0.5em] shadow-[0_0_50px_rgba(99,102,241,0.3)] transition-all active:scale-95 italic">Authorize Sync</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const LedgerActionCard = ({ icon: Icon, label, sub, onClick }: any) => (
    <div 
        onClick={onClick} 
        className="bg-[#05081a]/60 border border-white/5 rounded-[3.5rem] p-12 hover:bg-[#0a0f26] transition-all cursor-pointer group relative overflow-hidden shadow-2xl min-h-[320px] flex flex-col justify-between"
    >
        <div className="flex justify-between items-start">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-[#020617] shadow-[0_15px_40px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-500">
                <Icon size={32} strokeWidth={2.5} />
            </div>
            <ArrowUpRight size={24} className="text-slate-700 group-hover:text-brand transition-all duration-300" />
        </div>
        <div className="mt-8">
            <h4 className="text-[24px] font-black uppercase text-white tracking-tighter italic leading-tight mb-3 group-hover:text-brand transition-colors duration-500">
                {label}
            </h4>
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] italic">
                {sub}
            </p>
        </div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand/5 blur-[50px] group-hover:bg-brand/10 transition-all"></div>
    </div>
);

const ProtocolToggle = ({ icon: Icon, label, sub, defaultChecked }: any) => {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <div 
            onClick={() => setChecked(!checked)} 
            className="flex items-center justify-between p-8 bg-white/[0.02] border border-white/5 rounded-[2.8rem] hover:bg-white/[0.04] transition-all cursor-pointer group shadow-xl relative overflow-hidden"
        >
            <div className="flex items-center gap-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${checked ? 'bg-brand/20 text-brand shadow-[0_0_30px_rgba(99,102,241,0.4)] ring-1 ring-brand/30' : 'bg-white/5 text-slate-600'}`}>
                    <Icon size={26} strokeWidth={2.5} />
                </div>
                <div>
                    <h4 className="text-[17px] font-black text-white uppercase tracking-tighter italic leading-none mb-2 group-hover:text-brand transition-colors">
                        {label}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.25em] leading-tight opacity-70">
                        {sub}
                    </p>
                </div>
            </div>
            <div className={`w-14 h-7 rounded-full relative p-1 transition-all duration-500 shrink-0 ${checked ? 'bg-brand shadow-lg shadow-brand/30' : 'bg-slate-800'}`}>
                <div className={`w-5 h-5 rounded-full transition-all duration-500 transform ${checked ? 'translate-x-7 bg-white shadow-xl' : 'translate-x-0 bg-slate-500'}`}></div>
            </div>
            {checked && <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand/5 blur-[40px] pointer-events-none"></div>}
        </div>
    );
};

const SettingsToggle = ({ icon: Icon, label, sub, defaultChecked }: any) => {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <div onClick={() => setChecked(!checked)} className="flex items-center justify-between p-8 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:bg-white/[0.05] transition-all cursor-pointer group">
            <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl transition-all ${checked ? 'bg-brand/20 text-brand shadow-glow-brand' : 'bg-white/5 text-slate-500'}`}>
                    <Icon size={22} />
                </div>
                <div>
                    <h4 className="text-[15px] font-black text-white uppercase tracking-tight italic">{label}</h4>
                    <p className="text-[11px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{sub}</p>
                </div>
            </div>
            <div className={`w-14 h-7 rounded-full relative p-1 transition-all duration-500 ${checked ? 'bg-brand shadow-lg shadow-brand/20' : 'bg-slate-800'}`}>
                <div className={`w-5 h-5 rounded-full transition-all duration-500 transform ${checked ? 'translate-x-7 bg-white shadow-xl' : 'translate-x-0 bg-slate-500'}`}></div>
            </div>
        </div>
    );
};

export default Settings;
