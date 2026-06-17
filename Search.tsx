
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { searchLocalVideos } from '../services/storageService';
import { Video } from '../types';
import { Sparkles, Globe, Link as LinkIcon, Loader2, ArrowRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const Search: React.FC = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('search_query') || '';
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const loadResults = async () => {
      setLoading(true);
      const results = await searchLocalVideos(query);
      setVideos(results);
      setLoading(false);
      
      // If the query looks like a question or for current events, trigger AI Grounding
      if (query.length > 5) {
          triggerAiGrounding(query);
      }
    };
    if (query) loadResults();
  }, [query]);

  const triggerAiGrounding = async (q: string) => {
    setAiLoading(true);
    setAiResponse(null);
    setGroundingLinks([]);
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `The user is searching Azkaartube for: "${q}". Provide a brief context about this topic including any recent news or facts.`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        setAiResponse(response.text);
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        setGroundingLinks(chunks);
    } catch (e) {
        console.error("Grounding failed", e);
    } finally {
        // Fix: Removed incorrect nested setAiLoading call which returned void
        setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto p-4 md:p-10 pb-32">
      
      {/* AI Grounding Section */}
      {query && (aiLoading || aiResponse) && (
          <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="bg-brand/5 border border-brand/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Globe size={120} /></div>
                
                <div className="flex items-center gap-2 text-brand font-black text-[10px] uppercase tracking-[0.3em] mb-6">
                    <Sparkles size={14} /> Neural Search Insight
                </div>

                {aiLoading ? (
                    <div className="flex items-center gap-4 py-4">
                        <Loader2 size={24} className="animate-spin text-brand" />
                        <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Grounding with Google Search...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <p className="text-lg md:text-xl text-white font-medium leading-relaxed max-w-4xl italic">
                            "{aiResponse}"
                        </p>
                        
                        {groundingLinks.length > 0 && (
                            <div className="pt-6 border-t border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Sources & Citations</h4>
                                <div className="flex flex-wrap gap-3">
                                    {groundingLinks.map((chunk, i) => (
                                        <a 
                                            key={i} 
                                            href={chunk.web?.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                        >
                                            <LinkIcon size={12} /> {chunk.web?.title || 'Verified Source'}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
             </div>
          </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-black text-white">Search Results for "{query}"</h2>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{videos.length} videos found</span>
      </div>

      <div className="flex flex-col gap-8">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-6 animate-pulse">
                <div className="w-full md:w-[400px] aspect-video bg-slate-900 rounded-[2rem]"></div>
                <div className="flex-1 space-y-4 py-2">
                  <div className="h-6 bg-slate-900 rounded-full w-3/4"></div>
                  <div className="h-4 bg-slate-900 rounded-full w-1/4"></div>
                  <div className="h-32 bg-slate-900/50 rounded-[1.5rem] w-full"></div>
                </div>
              </div>
            ))
          : videos.map((video) => (
              <div key={video.id} className="group cursor-pointer flex flex-col md:flex-row gap-8 hover:bg-white/5 p-4 rounded-[3rem] transition-all duration-500">
                 <div className="w-full md:w-[400px] flex-shrink-0">
                    <VideoCard video={video} layout="row" /> 
                 </div>
                 <div className="hidden md:flex flex-col justify-center flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <img src={video.channelAvatarUrl} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white/10" />
                        <span className="text-white font-black text-sm uppercase tracking-widest">{video.channelName}</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium line-clamp-3 leading-relaxed mb-4">{video.description}</p>
                    <div className="flex items-center gap-4">
                        <div className="bg-brand/10 text-brand px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">New Discovery</div>
                        <button className="text-slate-500 hover:text-white transition-colors"><ArrowRight size={18} /></button>
                    </div>
                 </div>
              </div>
            ))}
            
        {!loading && videos.length === 0 && (
            <div className="text-center py-40 space-y-4 opacity-50">
                <Sparkles size={64} className="mx-auto mb-4" />
                <p className="font-black text-lg uppercase tracking-widest">Digital void encountered</p>
                <p className="text-sm">We couldn't find any direct video matches for "{query}".</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Search;
