
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertTriangle, LogIn, Mail, Lock, User, Eye, EyeOff, Play, Sparkles, ShieldCheck } from 'lucide-react';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { setUser } = useAuth();

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
          // Force direct open to home feed
          navigate('/', { replace: true });
        }
      } else {
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
                setUser(data.user);
                navigate('/', { replace: true });
            } else {
                setErrorMsg("Success! Please check your email to confirm your account.");
            }
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#020617] flex flex-col items-center justify-start md:justify-center p-4 sm:p-6 overflow-y-auto scrollbar-hide select-none">
      {/* Immersive Neural Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[80%] bg-brand/15 blur-[120px] rounded-full animate-pulse opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[80%] bg-brand/10 blur-[120px] rounded-full animate-pulse delay-1000 opacity-60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 flex flex-col items-center py-10 md:py-0 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
        
        {/* Logo Section - Scaled for impact */}
        <div className="text-center mb-10 md:mb-12">
          <div className="flex items-center justify-center gap-5 mb-8">
            <div className="w-16 h-12 md:w-20 md:h-14 bg-brand rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.5)] hover:scale-110 transition-transform duration-500 cursor-pointer group">
                <Play size={28} fill="white" className="text-white ml-1 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col items-start">
                <span className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
                    Azkaar<span className="text-brand">Tube</span>
                </span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em] ml-1">Creator Ecosystem</span>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-3">
            {isLogin ? 'Welcome Back' : 'Join the Future'}
          </h1>
          <p className="text-slate-400 font-medium text-base md:text-lg max-w-[280px] md:max-w-sm mx-auto opacity-80">
            {isLogin ? 'Sign in to access your neural dashboard' : 'Start your journey with the world\'s most intelligent video platform'}
          </p>
        </div>

        {/* Auth Card - Improved spacing and border fidelity */}
        <div className="w-full glass border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] p-6 sm:p-10 md:p-12 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative">
            {errorMsg && (
              <div className={`mb-6 md:mb-8 p-4 md:p-5 rounded-[1.5rem] flex items-start gap-4 text-sm animate-in slide-in-from-top-4 duration-500 ${errorMsg.includes('Success') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                {errorMsg.includes('Success') ? <LogIn size={20} /> : <AlertTriangle size={20} />}
                <span className="font-black uppercase tracking-tight leading-relaxed text-[11px] md:text-xs">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5 md:space-y-6">
              {!isLogin && (
                <div className="space-y-2 group">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-4">Display Handle</label>
                    <div className="relative">
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/5 rounded-2xl md:rounded-3xl px-6 py-4 md:py-5 outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/10 transition-all text-white placeholder-slate-700 font-bold pl-14 text-sm md:text-base"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                    </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-4">Email Protocol</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="w-full bg-black/40 border border-white/5 rounded-2xl md:rounded-3xl px-6 py-4 md:py-5 outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/10 transition-all text-white placeholder-slate-700 font-bold pl-14 text-sm md:text-base"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-4">Access Key</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-black/40 border border-white/5 rounded-2xl md:rounded-3xl px-6 py-4 md:py-5 outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/10 transition-all text-white placeholder-slate-700 font-bold pl-14 pr-14 text-sm md:text-base"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-600 text-white font-black py-4 md:py-5 rounded-2xl md:rounded-3xl transition-all shadow-[0_20px_50px_rgba(99,102,241,0.3)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-4 text-[10px] md:text-xs uppercase tracking-[0.3em] overflow-hidden group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles size={18} className="group-hover:animate-spin-slow transition-transform" />
                    {isLogin ? 'Initiate Link' : 'Register Node'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 md:mt-10 flex items-center gap-6">
                <div className="h-[1px] flex-1 bg-white/5"></div>
                <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] whitespace-nowrap">CROSS-PLATFORM</span>
                <div className="h-[1px] flex-1 bg-white/5"></div>
            </div>

            <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full mt-6 md:mt-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black py-4 md:py-5 rounded-2xl md:rounded-3xl transition-all flex items-center justify-center gap-4 active:scale-[0.98] text-[9px] md:text-[10px] uppercase tracking-widest group"
            >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                Auth with Google Workspace
            </button>
        </div>

        <div className="mt-10 md:mt-12 text-center pb-10">
          <p className="text-slate-500 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] flex flex-col md:flex-row items-center justify-center gap-2">
            <span>{isLogin ? "Neural signature not found?" : "Existing signal detected?"}</span>
            <button
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); }}
              className="text-brand font-black hover:text-brand-400 transition-colors uppercase tracking-[0.2em] border-b border-brand/30 pb-0.5"
            >
              {isLogin ? 'Create Account' : 'Log In Now'}
            </button>
          </p>
        </div>
      </div>

      {/* Futuristic status bar footer */}
      <div className="fixed bottom-6 w-full flex justify-center pointer-events-none opacity-40">
          <div className="flex items-center gap-10">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.6em]">SECURE_CHANNEL_V4.2</span>
              <div className="h-0.5 w-12 bg-white/5 rounded-full"></div>
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.6em]">NODE_SYNC_READY</span>
          </div>
      </div>
    </div>
  );
};

export default AuthPage;
