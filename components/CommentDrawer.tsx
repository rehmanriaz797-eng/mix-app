
import React, { useState, useEffect, useRef } from 'react';
import { ShortComment, Profile } from '../types';
import { fetchShortComments, postShortComment, toggleLikeComment, isCommentLiked } from '../services/storageService';
import { analyzeCommentAI } from '../services/geminiService';
import { X, Send, Heart, Pin, Sparkles, MessageCircle, Crown, Trophy, Star, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface CommentDrawerProps {
  shortId: string;
  onClose: () => void;
  creatorId: string;
}

const CommentDrawer: React.FC<CommentDrawerProps> = ({ shortId, onClose, creatorId }) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<ShortComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadComments();
  }, [shortId]);

  const loadComments = async () => {
    const data = await fetchShortComments(shortId);
    setComments(data);
  };

  const handleSend = async () => {
    if (!newComment.trim() || isPosting || !user) return;
    setIsPosting(true);
    
    try {
      // 1. Neural Moderation Bypass/Check
      const analysis = await analyzeCommentAI(newComment);
      if (!analysis.isSafe) {
          alert("Node Protocol Error: Comment contains restricted resonance.");
          setIsPosting(false);
          return;
      }

      const posted = await postShortComment(shortId, user.id, newComment, profile as Profile);
      setComments(prev => [{ ...posted, is_ai_highlighted: analysis.score > 80 }, ...prev]);
      setNewComment('');
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 top-[15%] z-[150] bg-[#020617]/98 backdrop-blur-3xl rounded-t-[4rem] shadow-[0_-20px_150px_rgba(0,0,0,1)] flex flex-col border-t border-white/10 animate-in slide-in-from-bottom duration-700 overflow-hidden">
      {/* Visual Pull Handle */}
      <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2"></div>

      <div className="flex items-center justify-between px-10 py-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-5">
          <h2 className="text-white font-black text-2xl tracking-tighter uppercase italic">Community Sync</h2>
          <div className="bg-brand/10 text-brand px-4 py-1.5 rounded-2xl flex items-center gap-2">
            <Sparkles size={14} />
            <span className="text-[11px] font-black uppercase tracking-widest">{comments.length} Nodes Active</span>
          </div>
        </div>
        <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 rounded-[1.5rem] transition-all border border-white/5 active:scale-90">
          <X size={24} className="text-slate-400 hover:text-white" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-8 space-y-12 scrollbar-hide pb-32">
        {comments.map((comment) => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            isCreator={comment.user_id === creatorId} 
          />
        ))}
      </div>

      <div className="p-8 pb-12 bg-black/60 border-t border-white/5 backdrop-blur-3xl sticky bottom-0">
        <div className="relative group">
          <div className="absolute inset-0 bg-brand/5 blur-2xl group-focus-within:bg-brand/10 transition-colors rounded-full"></div>
          <input 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Broadcast a thought to this node..."
            className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] px-10 py-7 pr-24 text-white text-lg outline-none focus:border-brand transition-all font-semibold placeholder-slate-700 shadow-2xl relative z-10"
          />
          <button 
            onClick={handleSend}
            disabled={!newComment.trim() || isPosting}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-5 rounded-[1.75rem] transition-all z-20 ${newComment.trim() && !isPosting ? 'bg-brand text-white shadow-[0_0_30px_rgba(99,102,241,0.6)] scale-105 active:scale-90' : 'bg-white/5 text-slate-700'}`}
          >
            {isPosting ? <div className="w-7 h-7 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={28} />}
          </button>
        </div>
      </div>
    </div>
  );
};

const CommentItem: React.FC<{ comment: ShortComment; isCreator: boolean }> = ({ comment, isCreator }) => {
  const [liked, setLiked] = useState(isCommentLiked(comment.id));
  const [likes, setLikes] = useState(comment.likes_count);
  
  const isElite = comment.profiles.is_premium;
  const isHighValue = (comment.ai_quality_score || 0) > 85 || comment.is_ai_highlighted;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowLiked = toggleLikeComment(comment.id);
    setLiked(nowLiked);
    setLikes(prev => nowLiked ? prev + 1 : prev - 1);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  return (
    <div className={`flex gap-6 group animate-in fade-in slide-in-from-left-6 duration-700 ${comment.is_pinned ? 'bg-brand/5 p-8 rounded-[3rem] -mx-4 border border-brand/20 shadow-2xl relative overflow-hidden' : ''}`}>
      {comment.is_pinned && <div className="absolute top-4 right-8 flex items-center gap-2 text-brand font-black text-[9px] uppercase tracking-widest"><Pin size={10} fill="currentColor" /> Pinned Node</div>}
      
      <div className="shrink-0 relative">
        <img src={comment.profiles.avatar_url} className={`w-16 h-16 rounded-[2rem] object-cover ring-2 ring-white/10 shadow-2xl transition-transform group-hover:scale-110 ${isElite ? 'ring-yellow-500/40' : ''}`} alt="" />
        {(comment.has_creator_heart || isCreator) && (
          <div className="absolute -bottom-1 -right-1 bg-[#020617] p-1.5 rounded-xl border border-brand/30 shadow-lg scale-110">
            {isCreator ? <Crown size={14} className="text-yellow-500 fill-current" /> : <Heart size={14} className="text-red-500 fill-current" />}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <span className={`text-lg font-black tracking-tight uppercase italic flex items-center gap-2 ${isCreator ? 'text-brand' : isElite ? 'text-yellow-500' : 'text-white'}`}>
              {comment.profiles.username}
              {isElite && <Crown size={16} />}
            </span>
            
            {isHighValue && (
                <div className="flex items-center gap-1 bg-brand/10 text-brand px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-brand/20 shadow-glow-brand animate-glow-pulse">
                    <Sparkles size={12} /> High Resonance
                </div>
            )}
            
            <span className="text-[11px] text-slate-600 font-bold uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <p className={`text-lg leading-relaxed font-medium ${isHighValue ? 'text-white' : 'text-slate-300'}`}>
          {comment.content}
        </p>

        <div className="flex items-center gap-10 pt-2">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2.5 transition-all duration-500 ${liked ? 'text-red-500 scale-125' : 'text-slate-600 hover:text-white'}`}
          >
            <Heart size={20} className={liked ? 'fill-current' : ''} />
            <span className="text-[13px] font-black">{likes.toLocaleString()}</span>
          </button>
          
          <button className="text-slate-600 hover:text-brand text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2">
            Respond <Send size={12} />
          </button>

          {comment.has_creator_heart && (
              <div className="flex items-center gap-2 text-red-500/80 text-[10px] font-black uppercase tracking-widest italic animate-bounce-slow">
                 <Heart size={16} fill="currentColor" /> Hearted
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentDrawer;
