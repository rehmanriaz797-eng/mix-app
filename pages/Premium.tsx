

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionPlan } from '../types';
import { Zap, Crown, Check, Sparkles, X, Smartphone, ShieldCheck, Star } from 'lucide-react';
// Added missing useAuth import to provide user context for AI suggestions
import { useAuth } from '../hooks/useAuth';

const Premium: React.FC = () => {
  const navigate = useNavigate();
  // Obtained user from useAuth hook
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [aiPick, setAiPick] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    subscriptionService.getPlans().then(setPlans);
    // Fix: Passing required userId and empty usage object to getAISuggestion
    subscriptionService.getAISuggestion(user?.id || 'guest', {}).then(setAiPick);
    setLoading(false);
  }, [user]);

  const handleCheckout = (p: SubscriptionPlan) => {
      setSelectedPlan(p);
      setShowCheckout(true);
  };

  return (
    <div className="min-h-screen bg-yt-base text-white pb-32 font-sans overflow-x-hidden">
      <div className="relative h-[650px] flex flex-col items-center justify-center text-center px-8">
          <div className="absolute inset-0 bg-gradient-to-b from-brand/20 via-transparent to-transparent"></div>
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="w-20 h-20 bg-yellow-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(234,179,8,0.4)] animate-pulse">
                  <Crown size={40} className="text-white fill-white" />
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none mb-8">
                The Final <br/><span className="text-brand">Protocol.</span>
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl font-medium leading-relaxed italic">
                Experience AzkaarTube with zero latency, zero ads, and maximum creator resonance.
              </p>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
          {aiPick && (
              <div className="mb-16 p-10 bg-brand/5 border border-brand/20 rounded-[4rem] flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-5"><Sparkles size={120} /></div>
                  <div className="p-6 bg-brand rounded-3xl shadow-2xl relative z-10 animate-bounce-slow"><Sparkles size={32} /></div>
                  <div className="flex-1 text-center md:text-left relative z-10">
                      <div className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-3">Neural Match Recommendation</div>
                      <p className="text-2xl font-black italic tracking-tight leading-tight">"{aiPick.reason}"</p>
                  </div>
                  <button className="px-10 py-5 bg-brand text-white font-black rounded-2xl text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">Sync AI Pick</button>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {plans.map((plan) => (
                  <div key={plan.id} className={`relative p-12 rounded-[4rem] border transition-all duration-700 hover:-translate-y-4 ${plan.is_popular ? 'bg-brand/5 border-brand/50 shadow-[0_40px_100px_rgba(99,102,241,0.2)] scale-105' : 'bg-white/[0.03] border-white/5'}`}>
                      {plan.is_popular && <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-brand text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">Most Optimized</div>}
                      <div className="mb-12">
                          <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">{plan.name}</h3>
                          <div className="text-5xl font-black">{plan.currency} {plan.price} <span className="text-sm opacity-30">/mo</span></div>
                      </div>
                      <div className="space-y-6 mb-16 flex-1">
                          {plan.features.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-4">
                                  <div className="w-6 h-6 bg-brand/10 text-brand rounded-lg flex items-center justify-center shadow-inner"><Check size={14} strokeWidth={4} /></div>
                                  <span className="text-sm font-bold text-slate-300 tracking-tight">{f}</span>
                              </div>
                          ))}
                      </div>
                      <button 
                        onClick={() => handleCheckout(plan)}
                        className={`w-full py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl ${plan.is_popular ? 'bg-brand text-white hover:bg-brand-600' : 'bg-white text-black hover:bg-brand hover:text-white'}`}
                      >
                        Elevate Identity
                      </button>
                  </div>
              ))}
          </div>
      </div>

      {showCheckout && selectedPlan && (
          <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
              <div className="bg-[#0b1026] w-full max-w-xl rounded-[4rem] p-12 border border-white/10 shadow-[0_0_150px_rgba(0,0,0,0.8)] relative text-center">
                  <button onClick={() => setShowCheckout(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-all"><X size={32}/></button>
                  
                  <div className="w-24 h-24 bg-brand/10 text-brand rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-brand/10">
                      <Smartphone size={48} />
                  </div>
                  
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-2">Sync Payment</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-12">JazzCash / Easypaisa Direct</p>
                  
                  <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 mb-10 text-left space-y-6">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                          <span>Account Target</span>
                          <span className="text-red-500">Manual Entry Required</span>
                      </div>
                      <div className="text-3xl font-black text-white tracking-widest">0307 8413 807</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">"Transmit {selectedPlan.currency} {selectedPlan.price} and provide the 12-digit transaction ID below for node verification."</p>
                  </div>

                  <input className="w-full bg-black border border-white/10 rounded-2xl p-6 text-xl font-black text-white text-center outline-none focus:border-brand mb-8 shadow-inner" placeholder="TXID-00000000" />
                  
                  <button className="w-full py-6 bg-brand text-white font-black rounded-3xl text-[10px] uppercase tracking-[0.4em] shadow-xl shadow-brand/30 flex items-center justify-center gap-3 active:scale-95 transition-all">
                      <ShieldCheck size={20} /> Authorize Handshake
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Premium;
