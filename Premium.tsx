

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { subscriptionService } from './services/subscriptionService';
import { SubscriptionPlan, BillingCycle } from './types';
import { 
    Zap, Crown, ShieldCheck, Download, MonitorPlay, 
    Sparkles, Film, Bell, Bot, MessageSquare, Check, 
    ArrowRight, Star, Globe, Smartphone, Heart, Clock, X,
    Copy, Smartphone as MobileIcon, ExternalLink
} from 'lucide-react';

const FEATURES = [
  { icon: Zap, title: "Zero Ads Mode", desc: "No interruptions. Faster feed loading." },
  { icon: Star, title: "Ultra HD+ Video", desc: "4K/8K streaming with high bitrate audio." },
  { icon: Download, title: "Offline Downloads", desc: "Auto-download favorites for the road." },
  { icon: MonitorPlay, title: "Background Play", desc: "Listen while screen is off or in PIP." },
  { icon: Sparkles, title: "Premium Boost", desc: "2x reach on your shorts and priority feeds." },
  { icon: Heart, title: "Neon Themes", desc: "Exclusive profile themes and animated avatars." },
  { icon: Film, title: "Exclusive Feed", desc: "Behind-the-scenes and early access content." },
  { icon: Bell, title: "Silent Glow", desc: "Advanced AI notification mood control." },
  { icon: Bot, title: "AI Pro Tools", desc: "Face enhancement and auto-caption filters." },
  { icon: MessageSquare, title: "VIP Chat", desc: "Premium badges and slow-mode bypass." }
];

const CHANNELS = [
    { id: 'jazzcash', name: 'JazzCash', icon: 'ZC', color: 'text-red-500' },
    { id: 'easypaisa', name: 'Easypaisa', icon: 'EP', color: 'text-green-500' },
    { id: 'stripe', name: 'Stripe', icon: 'ST', color: 'text-blue-500' },
    { id: 'paypal', name: 'PayPal', icon: 'PP', color: 'text-indigo-500' },
    { id: 'gpay', name: 'Google Pay', icon: 'GP', color: 'text-slate-400' },
    { id: 'apple', name: 'Apple Pay', icon: 'AP', color: 'text-white' }
];

const Premium: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [purchaseStep, setPurchaseStep] = useState<'browse' | 'checkout' | 'success'>('browse');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('jazzcash');
  const [txId, setTxId] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
        const [pData, suggestion] = await Promise.all([
            subscriptionService.getPlans(),
            // Fixed: Passing user.id as first argument
            user ? subscriptionService.getAISuggestion(user.id, {}) : null
        ]);
        setPlans(pData);
        setAiSuggestion(suggestion);
        setLoading(false);
    };
    load();
  }, [user]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
      if (!user) return navigate('/login');
      setSelectedPlan(plan);
      setPurchaseStep('checkout');
  };

  const confirmPurchase = async () => {
      if (!user || !selectedPlan) return;
      if (selectedChannel === 'jazzcash' && !txId.trim()) {
          alert("Please enter the Transaction ID provided by JazzCash.");
          return;
      }
      setLoading(true);
      // Fixed: subscribe method now exists in subscriptionService
      await subscriptionService.subscribe(user.id, selectedPlan.id, billingCycle, selectedChannel);
      setLoading(false);
      setPurchaseStep('success');
      if (navigator.vibrate) navigator.vibrate([20, 100, 20]);
  };

  const copyNumber = () => {
      navigator.clipboard.writeText('03078413807');
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
  };

  if (purchaseStep === 'success') {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-yt-base p-6 text-center animate-in zoom-in duration-500">
               <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)] mb-8 animate-bounce">
                   <Crown size={48} className="text-white fill-white" />
               </div>
               <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">PROTOCOL ACTIVATED</h1>
               <p className="text-xl text-slate-400 max-w-md font-medium mb-12 italic">"Your status has been elevated to Elite. All Premium nodes are now fully operational."</p>
               <button 
                onClick={() => navigate('/')}
                className="px-12 py-5 bg-brand text-white font-black rounded-2xl text-xs uppercase tracking-[0.3em] hover:bg-brand-600 transition-all shadow-2xl active:scale-95"
               >
                   Enter Platform
               </button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-yt-base text-white pb-32 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative h-[600px] overflow-hidden flex flex-col items-center justify-center text-center px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-brand/20 via-yt-base to-yt-base z-0"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 blur-[150px] rounded-full animate-pulse"></div>
          
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex items-center justify-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/20">
                      <Crown size={24} className="text-white" />
                  </div>
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em]">Azkaar Premium</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 uppercase italic">
                  Level up your<br /><span className="text-brand">Reality.</span>
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                  Join millions of elite creators. Experience video as it was meant to be: Intelligence-driven, Ad-free, and in stunning 8K.
              </p>
          </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-32">
          {FEATURES.map((f, i) => (
              <div key={i} className="p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.06] hover:border-brand/40 transition-all group cursor-default">
                  <div className="p-3 bg-brand/10 text-brand rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                      <f.icon size={24} />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-tight mb-2">{f.title}</h3>
                  <p className="text-[12px] text-slate-500 font-bold leading-relaxed">{f.desc}</p>
              </div>
          ))}
      </div>

      {/* Pricing Section */}
      <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-4 uppercase tracking-tight italic">Choose your protocol</h2>
              <div className="flex items-center justify-center gap-4 mt-8">
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'text-white scale-110' : 'text-slate-600'}`}>Monthly</span>
                  <button 
                    onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                    className="w-16 h-8 bg-slate-800 rounded-full p-1 relative transition-colors shadow-inner"
                  >
                      <div className={`w-6 h-6 bg-brand rounded-full transition-all shadow-lg ${billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'}`}></div>
                  </button>
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'text-white scale-110' : 'text-slate-600'}`}>Yearly <span className="text-brand">(SAVE 20%)</span></span>
              </div>
          </div>

          {/* AI Suggestion Box */}
          {aiSuggestion && (
              <div className="mb-12 p-8 bg-brand/5 border border-brand/20 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-top-4 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="p-5 bg-brand rounded-[2rem] shadow-2xl relative z-10"><Sparkles size={32} /></div>
                  <div className="flex-1 text-center md:text-left relative z-10">
                      <div className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2">Neural Recommendation</div>
                      <p className="text-lg font-bold italic">"{aiSuggestion.reason}"</p>
                  </div>
                  <button 
                    onClick={() => {
                        const target = plans.find(p => p.tier === aiSuggestion.planId.split('_')[1]);
                        if (target) handleSubscribe(target);
                    }}
                    className="relative z-10 px-8 py-4 bg-brand text-white font-black rounded-2xl text-[10px] uppercase tracking-widest whitespace-nowrap hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-brand/40"
                  >
                      Select Recommended
                  </button>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                  <div key={plan.id} className={`relative p-10 rounded-[3.5rem] border flex flex-col transition-all duration-500 hover:-translate-y-2 ${plan.is_popular ? 'bg-brand/5 border-brand/50 shadow-[0_40px_100px_rgba(99,102,241,0.2)] scale-105' : 'bg-yt-spec border-white/5 shadow-xl'}`}>
                      {plan.is_popular && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Most Popular</div>
                      )}
                      
                      <div className="mb-10">
                          <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">{plan.name}</h3>
                          <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-black">{plan.currency} {billingCycle === 'yearly' ? (plan.price * 0.8).toFixed(2) : plan.price}</span>
                              <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">/ {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                          </div>
                      </div>

                      <div className="space-y-5 mb-12 flex-1">
                          {plan.features.map((feat, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                  <div className="bg-brand/10 p-1.5 rounded-xl text-brand"><Check size={14} strokeWidth={4} /></div>
                                  <span className="text-sm font-bold text-slate-300 tracking-tight">{feat}</span>
                              </div>
                          ))}
                      </div>

                      <button 
                        onClick={() => handleSubscribe(plan)}
                        className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${plan.is_popular ? 'bg-brand text-white shadow-brand/20 hover:bg-brand-600' : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'}`}
                      >
                          Subscribe Now
                      </button>
                  </div>
              ))}
          </div>
      </div>

      {/* Checkout Modal */}
      {purchaseStep === 'checkout' && selectedPlan && (
          <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-[#080c1d] border border-white/10 w-full max-w-lg rounded-[3.5rem] p-10 shadow-[0_0_150px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent animate-marquee"></div>
                  
                  <button onClick={() => setPurchaseStep('browse')} className="absolute top-8 right-8 text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all"><X size={24}/></button>
                  
                  <div className="mb-10 text-center">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Sync Payment</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Establishing Secure Neural Link</p>
                  </div>
                  
                  <div className="p-8 bg-brand/10 rounded-[2.5rem] border border-brand/20 mb-8 shadow-inner">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected protocol</span>
                          <div className="bg-brand text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{selectedPlan.name}</div>
                      </div>
                      <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total cost</span>
                          <div className="text-4xl font-black flex items-start gap-1">
                              <span className="text-lg mt-1 text-brand">{selectedPlan.currency}</span>
                              {billingCycle === 'yearly' ? (selectedPlan.price * 0.8).toFixed(2) : selectedPlan.price}
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-6 mb-10">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShieldCheck size={14} className="text-brand" /> Verified Secure Channels
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {CHANNELS.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => setSelectedChannel(p.id)}
                                    className={`p-4 rounded-[2rem] border transition-all cursor-pointer flex flex-col items-center gap-2 relative group overflow-hidden ${selectedChannel === p.id ? 'bg-brand/10 border-brand shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className={`w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center font-black text-xs ${p.color} transition-transform group-hover:scale-110`}>
                                        {p.id === 'jazzcash' ? <MobileIcon size={20} /> : p.icon}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${selectedChannel === p.id ? 'text-white' : 'text-slate-500'}`}>{p.name}</span>
                                    {selectedChannel === p.id && (
                                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_8px_rgba(99,102,241,1)]"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Channel Specific Inputs */}
                    {selectedChannel === 'jazzcash' && (
                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 mb-8 animate-in slide-in-from-bottom-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2 italic">
                                <MobileIcon size={16} className="text-red-500" /> JazzCash Instructions
                            </h3>
                            <div className="space-y-6">
                                <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Account</span>
                                        <span className="text-xl font-black tracking-widest text-red-500">0307 8413 807</span>
                                    </div>
                                    <button 
                                        onClick={copyNumber}
                                        className={`p-3 rounded-xl transition-all ${showCopied ? 'bg-green-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                                    >
                                        {showCopied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Transaction ID (TID)</label>
                                    <div className="relative group">
                                        <input 
                                            value={txId}
                                            onChange={e => setTxId(e.target.value)}
                                            placeholder="Enter 12-digit TID from SMS"
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 outline-none focus:border-red-500 transition-all text-white font-mono tracking-widest uppercase text-sm"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 opacity-50"><ExternalLink size={18} /></div>
                                    </div>
                                    <p className="text-[8px] text-slate-500 italic ml-2 uppercase tracking-tighter">Your transfer is manually verified within 3-15 minutes by our node validators.</p>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/5 bg-[#080c1d] z-20">
                    <button 
                        onClick={confirmPurchase}
                        disabled={loading || (selectedChannel === 'jazzcash' && !txId.trim())}
                        className="w-full py-5 bg-brand text-white font-black rounded-[2rem] text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(99,102,241,0.3)] hover:bg-brand-600 active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-30"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />}
                        {selectedChannel === 'jazzcash' ? 'Validate Transfer' : 'Authorize Protocol'}
                    </button>
                    <p className="text-center text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] mt-6 italic">Secure 256-bit AES Encryption Handshake Active</p>
                  </div>
              </div>
          </div>
      )}

      {/* Internal Scroll Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.5); }
      `}} />
    </div>
  );
};

export default Premium;
