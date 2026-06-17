import React, { useState, useRef, useEffect } from 'react';
import { Video } from '../types';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Play, VolumeX } from 'lucide-react';

interface VideoCardProps {
  video: Video;
  layout?: 'grid' | 'row';
}

const VideoCard: React.FC<VideoCardProps> = ({ video, layout = 'grid' }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  const handleVideoClick = () => {
    navigate(`/watch/${video.id}`, { state: { video } });
  };

  const handleChannelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/channel/${video.channelHandle}`);
  };

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = window.setTimeout(() => {
        setIsHovered(true);
    }, 400); // Slight delay for intent
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  if (layout === 'row') {
    return (
      <div 
        className="flex gap-4 cursor-pointer group p-2 rounded-2xl hover:bg-white/5 transition-all" 
        onClick={handleVideoClick}
      >
        <div className="relative w-48 shrink-0 aspect-video rounded-xl overflow-hidden bg-slate-900 border border-white/5 shadow-lg">
          <img 
            src={video.thumbnailUrl} 
            alt={video.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms]" 
          />
          <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest">
            {video.duration}
          </span>
        </div>
        <div className="flex-1 min-w-0 py-1">
          <h3 className="font-black text-xs line-clamp-2 text-white group-hover:text-brand transition-colors leading-tight mb-2 uppercase tracking-tighter italic">
            {video.title}
          </h3>
          <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1.5 mb-1 hover:text-white" onClick={handleChannelClick}>
              <span>{video.channelName}</span>
              <CheckCircle2 size={10} className="text-brand" fill="currentColor" />
          </div>
          <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest">
              {video.views} Views • {video.postedAt}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col gap-3 cursor-pointer group transition-all"
      onClick={handleVideoClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-white/5 border border-white/5 group-hover:shadow-brand/20 transition-all duration-500">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title} 
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
        />
        
        {isHovered && (
            <div className="absolute inset-0 bg-black">
                <video
                    src={video.videoUrl}
                    className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-700"
                    autoPlay
                    muted
                    loop
                    playsInline
                />
                <div className="absolute bottom-3 left-3 bg-black/60 p-1.5 rounded-lg backdrop-blur-md border border-white/10 z-10">
                    <VolumeX size={12} className="text-white/60" />
                </div>
            </div>
        )}

        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/20 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                <Play size={18} fill="white" className="text-white ml-0.5" />
            </div>
        </div>

        <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md text-white text-[9px] px-2.5 py-1 rounded-xl font-black tracking-widest border border-white/10 group-hover:opacity-0 transition-opacity">
          {video.duration}
        </div>
      </div>

      <div className="flex gap-4 px-2">
        <div className="relative shrink-0 pt-1" onClick={handleChannelClick}>
            <img 
                src={video.channelAvatarUrl} 
                className="w-10 h-10 rounded-[1.25rem] object-cover ring-2 ring-white/5 shadow-xl hover:scale-110 transition-transform"
            />
            <div className="absolute -bottom-1 -right-1 bg-brand p-1 rounded-lg border-2 border-[#020617] text-white">
                <CheckCircle2 size={8} fill="currentColor" />
            </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-black text-[14px] line-clamp-2 leading-tight mb-1.5 group-hover:text-brand transition-colors tracking-tight uppercase italic">
            {video.title}
          </h3>
          <div className="flex flex-col" onClick={handleChannelClick}>
              <span className="text-slate-500 text-[10px] font-bold tracking-widest truncate hover:text-white transition-colors">{video.channelName}</span>
              <div className="text-slate-600 text-[9px] font-black uppercase tracking-[0.15em] opacity-80 mt-0.5">
                  {video.views} Views • {video.postedAt}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;