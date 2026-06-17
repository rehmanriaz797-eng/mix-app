
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertTriangle, LogIn, Mail, Lock, User, Eye, EyeOff, Play, Sparkles, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setUser(data.user);
          navigate('/', { replace: true });
        }
      } else {
        // Identity Node Registration
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    full_name: username || email.split('@')[0],
                    username: username || email.split('@')[0],
                }
            }
        });
        if (error) throw error;
        
        if (data.user) {
            if (data.session) {
                // Instant Auto-Link
                setUser(data.user);
                navigate('/', { replace: true });
            } else {
                // Outbound signal sent
                setIsVerificationSent(true);
            }
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Neural link authorization failed.");
    } finally {
      setLoading(false);
    }
  };

  if (isVerificationSent) {
    return (
        <div className="fixed inset-0 z-[2000] bg-[#020617] flex flex-col items-center justify-center p-6 select-none font-sans">
            <div className="w-full max-w-md bg-[#0d1117] border border-brand/20 rounded-[3rem] p-12 text-center shadow-[0_0_100px_rgba(99,102,241,0.1)] animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">Signal Transmitted</h2>
                <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                    A secure verification link has been sent to <span className="text-white font-bold">{email}</span>. Authorize the signal to activate your identity.
                </p>
                <button 
                    onClick={() => setIsLogin(true)}
                    className="w-full bg-white text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-brand hover:text-white transition-all flex items-center justify-center gap-2 group"
                >
                    Return to Login <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-[#020617] flex flex-col items-center justify-center p-6 overflow-y-auto scrollbar-hide select-none font-sans">
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand/20 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-14 h-11 bg-brand rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                <Play size={24} fill="white" className="text-white ml-0.5" />
            </div>
            <span className="text-3xl font-black text-white tracking-tighter uppercase italic">
                Azkaar<span className="text-brand">Tube</span>
            </span>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/5 to-transparent pointer-events-none rotate-12"></div>
            
            {errorMsg && (
              <div className="mb-8 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-500 bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span className="font-black text-[11px] tracking-widest leading-relaxed uppercase">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6 relative z-10">
              {!isLogin && (
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] ml-4">Neural Handle</label>
                    <div className="relative group">
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/10 transition-all text-white placeholder-slate-700 font-bold pl-14 text-sm"
                            placeholder="choose_identity"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand transition-colors" size={20} />
                    </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] ml-4">Signal ID (Email)</label>
                <div className="relative group">
                  <input
                    type="email"
                    required
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/10 transition-all text-white placeholder-slate-700 font-bold pl-14 text-sm"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand transition-colors" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] ml-4">Access Key</label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/10 transition-all text-white placeholder-slate-700 font-bold pl-14 pr-14 text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand transition-colors" size={20} />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-600 text-white font-black py-4.5 rounded-3xl transition-all shadow-[0_15px_40px_rgba(99,102,241,0.3)] active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] h-[60px]"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <><Sparkles size={18} /> {isLogin ? 'Initiate Link' : 'Construct Identity'}</>}
              </button>
            </form>
        </div>

        <div className="mt-10 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); }}
              className="text-slate-500 font-black hover:text-brand transition-all uppercase tracking-[0.15em] text-[10px] py-3 px-6 border-2 border-dashed border-white/5 rounded-2xl hover:border-brand/30"
            >
              {isLogin ? 'Register New Node' : 'Existing Signal Detected'}
            </button>
        </div>
      </div>
      
      <div className="fixed bottom-6 w-full text-center pointer-events-none opacity-20">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.6em]">Secure Protocol v4.2.1</p>
      </div>
    </div>
  );
};

export default AuthPage;
