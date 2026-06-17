import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, ImageIcon, X, Zap, Sparkles } from 'lucide-react';
import { fastAIChat, analyzeImage } from '../services/geminiService';
import { AIChatMessage } from '../types';

const AIChat = () => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { role: 'model', content: "Hello! I'm Azkaar AI. I can chat lightning-fast or analyze your images. How can I help today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !attachedImage) return;

    const userMsg: AIChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        let responseText = "";
        if (attachedImage) {
            // Complex Task: Image Analysis uses Pro
            const base64Data = attachedImage.split(',')[1];
            responseText = await analyzeImage(base64Data, input);
            setAttachedImage(null);
        } else {
            // Fast Task: General Chat uses Flash Lite
            responseText = await fastAIChat([...messages, userMsg]);
        }
        setMessages(prev => [...prev, { role: 'model', content: responseText, timestamp: Date.now() }]);
    } catch (e) {
        setMessages(prev => [...prev, { role: 'model', content: "I encountered an error. Please check your connection.", timestamp: Date.now() }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-[#020617] text-white max-w-4xl mx-auto border-x border-white/5 shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-[#020617] flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
                <Bot size={22} className="text-white" />
            </div>
            <div>
                <h1 className="font-black text-sm uppercase tracking-widest">Azkaar AI</h1>
                <p className="text-[10px] text-brand font-bold flex items-center gap-1.5">
                    <Zap size={10} fill="currentColor" /> FAST MODE ACTIVE
                </p>
            </div>
        </div>
        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-tighter">
            Powered by Gemini 3
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {messages.map((msg, idx) => {
            const isBot = msg.role === 'model';
            return (
                <div key={idx} className={`flex gap-4 ${isBot ? '' : 'flex-row-reverse'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${isBot ? 'bg-brand' : 'bg-slate-800'}`}>
                        {isBot ? <Bot size={18} /> : <UserIcon size={18} />}
                    </div>
                    <div className={`max-w-[85%] p-5 rounded-[2rem] leading-relaxed shadow-lg ${isBot ? 'bg-white/5 text-slate-100 rounded-tl-none border border-white/5' : 'bg-brand text-white rounded-tr-none'}`}>
                        <p className="text-[15px] font-medium whitespace-pre-wrap">{msg.content}</p>
                    </div>
                </div>
            );
        })}
        {loading && (
            <div className="flex gap-4 animate-pulse">
                 <div className="w-9 h-9 bg-brand rounded-2xl flex items-center justify-center"><Bot size={18} /></div>
                 <div className="bg-white/5 p-5 rounded-[2rem] rounded-tl-none border border-white/5 flex items-center gap-3">
                     <Loader2 size={20} className="animate-spin text-brand" />
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generating Insight...</span>
                 </div>
            </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-[#020617] border-t border-white/5 space-y-4">
          {attachedImage && (
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl animate-in zoom-in duration-200">
                  <img src={attachedImage} className="w-16 h-16 rounded-xl object-cover ring-1 ring-white/20" />
                  <div className="flex-1">
                      <p className="text-xs font-black text-slate-400 uppercase">Image Attached</p>
                      <p className="text-[10px] text-brand font-bold uppercase tracking-widest">Ready for Vision Analysis</p>
                  </div>
                  <button onClick={() => setAttachedImage(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-500">
                      <X size={20} />
                  </button>
              </div>
          )}
          
          <div className="relative group">
              <input 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 placeholder={attachedImage ? "Ask about this image..." : "Chat with Azkaar AI..."}
                 className="w-full bg-white/5 border border-white/10 text-white p-5 pr-32 rounded-[2rem] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-medium placeholder-slate-600"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-slate-500 hover:text-brand transition-colors"
                  >
                      <ImageIcon size={22} />
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={loading || (!input.trim() && !attachedImage)}
                    className="p-3.5 bg-brand rounded-2xl text-white hover:bg-brand-600 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-brand/20 active:scale-95"
                  >
                      <Send size={22} />
                  </button>
              </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          <p className="text-[10px] font-black text-center text-slate-700 uppercase tracking-[0.2em]">Enhanced Intelligence by Google Gemini</p>
      </div>
    </div>
  );
};

export default AIChat;
