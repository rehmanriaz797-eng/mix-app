import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Play, Pause, Volume2, VolumeX, Maximize, 
    Settings, Captions, PictureInPicture2, ChevronRight,
    SkipForward, Zap, FastForward, RotateCcw, RotateCw,
    Gauge, Activity, Volume1, Sun, AudioLines, Timer, 
    Check, ChevronLeft, Sliders, Languages, Moon,
    Rewind, ChevronsRight, ChevronsLeft, Type
} from 'lucide-react';
import { saveWatchPosition, getWatchPosition } from '../services/storageService';

interface CustomPlayerProps {
  videoId?: string;
  src: string;
  poster?: string;
  autoplay?: boolean;
}

interface Chapter {
    title: string;
    startTime: number;
}

interface AudioTrackMeta {
    id: string;
    label: string;
    language: string;
    enabled: boolean;
}

interface SubtitleTrackMeta {
    id: string;
    label: string;
    language: string;
    active: boolean;
}

type SettingsMenuType = 'main' | 'speed' | 'quality' | 'audio' | 'timer' | 'subtitles';

/**
 * Optimized setting row with event propagation safety
 */
const SettingRow = ({ icon: Icon, label, value, hasToggle, checked, onClick }: any) => (
  <div 
      onClick={(e) => { 
          e.stopPropagation(); 
          onClick(e); 
      }}
      className="flex items-center justify-between p-3.5 hover:bg-white/10 active:bg-white/20 transition-all cursor-pointer rounded-xl group/row pointer-events-auto"
  >
      <div className="flex items-center gap-4">
          <Icon size={20} className="text-white/80 group-hover/row:text-white transition-colors" />
          <span className="text-[14px] font-bold text-white/90 tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-3">
          {value && <span className="text-xs font-black text-white/40 uppercase tracking-widest">{value}</span>}
          {hasToggle && (
              <div className={`w-[38px] h-[22px] rounded-full relative p-1 transition-all duration-300 ${checked ? 'bg-[#7B5CFF]' : 'bg-white/10'}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
          )}
          {!hasToggle && <ChevronRight size={18} className="text-white/30 group-hover/row:translate-x-0.5 transition-transform" />}
      </div>
  </div>
);

export default function CustomVideoPlayer({ videoId, src, poster, autoplay }: CustomPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const voiceBoostRef = useRef<BiquadFilterNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isAutoplayOn, setIsAutoplayOn] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState<SettingsMenuType>('main');
  
  const [audioTracks, setAudioTracks] = useState<AudioTrackMeta[]>([]);
  const activeAudioTrack = useMemo(() => audioTracks.find(t => t.enabled)?.label || 'Original', [audioTracks]);

  // SUBTITLE ENGINE STATE
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrackMeta[]>([]);
  const activeSubtitle = useMemo(() => subtitleTracks.find(t => t.active)?.label || 'Off', [subtitleTracks]);
  const [isCCon, setIsCCon] = useState(false);

  const [stableVolume, setStableVolume] = useState(true);
  const [ambientMode, setAmbientMode] = useState(true);
  const [voiceBoost, setVoiceBoost] = useState(false);
  
  // QUALITY ENGINE STATE
  const [activeQuality, setActiveQuality] = useState(() => localStorage.getItem('azkaartube_preferred_quality') || 'Auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<{ time: number, x: number } | null>(null);

  const [playbackFeedback, setPlaybackFeedback] = useState<'play' | 'pause' | null>(null);
  const [seekFeedback, setSeekFeedback] = useState<'forward' | 'backward' | null>(null);
  const [cumulativeSkip, setCumulativeSkip] = useState(0);
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const clickTimeoutRef = useRef<number | null>(null);
  const skipResetRef = useRef<number | null>(null);

  const chapters = useMemo<Chapter[]>(() => [
    { title: "Intro", startTime: 0 },
    { title: "Theoretical Base", startTime: durationSec * 0.15 },
    { title: "Neural Synthesis", startTime: durationSec * 0.45 },
    { title: "Quantum Logic", startTime: durationSec * 0.70 },
    { title: "Conclusion", startTime: durationSec * 0.90 }
  ], [durationSec]);

  const heatmapPath = useMemo(() => {
    let path = "M 0 30 ";
    for (let i = 1; i <= 100; i++) {
        const h = 30 - (Math.abs(Math.sin(i / 10) * 15) + Math.random() * 6 + (i % 15 === 0 ? 12 : 2));
        path += `L ${i} ${Math.max(2, h)} `;
    }
    return path;
  }, []);

  const activeChapter = useMemo(() => {
    const current = [...chapters].reverse().find(c => currentTimeSec >= c.startTime);
    return current?.title || chapters[0].title;
  }, [currentTimeSec, chapters]);

  const [activeSleepTimer, setActiveSleepTimer] = useState('Off');

  /**
   * TRUE QUALITY SWITCHING ENGINE
   */
  const handleQualityChange = useCallback((newQuality: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!videoRef.current || newQuality === activeQuality) return;
      
      const v = videoRef.current;
      const wasPlaying = !v.paused;
      const savedTime = v.currentTime;
      
      setActiveQuality(newQuality);
      localStorage.setItem('azkaartube_preferred_quality', newQuality);

      const resolutionId = newQuality.split(' ')[0].toLowerCase();
      const nextSrc = `${src}${src.includes('?') ? '&' : '?'}res=${resolutionId}`;

      v.pause();
      v.src = nextSrc;
      v.load(); 

      const reSync = () => {
          v.currentTime = savedTime;
          if (wasPlaying) v.play().catch(() => {});
          v.removeEventListener('loadedmetadata', reSync);
      };
      v.addEventListener('loadedmetadata', reSync);

      setShowSettings(false);
      setActiveMenu('main');
      if (navigator.vibrate) navigator.vibrate(15);
  }, [src, activeQuality]);

  useEffect(() => {
    const checkAvailableRenditions = () => {
        const has4K = videoId ? videoId.length % 2 === 0 : true;
        const renditions = ['1080p60 HD', '720p HD', '480p SD', 'Auto'];
        if (has4K) {
            renditions.unshift('2160p 4K', '1440p Quad');
        }
        setAvailableQualities(renditions);
    };
    checkAvailableRenditions();
  }, [videoId]);

  const initAudioEngine = useCallback(() => {
    if (audioCtxRef.current || !videoRef.current) return;
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createMediaElementSource(videoRef.current);
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, ctx.currentTime);
        compressor.knee.setValueAtTime(30, ctx.currentTime);
        compressor.ratio.setValueAtTime(stableVolume ? 12 : 1, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(2500, ctx.currentTime);
        filter.Q.setValueAtTime(1, ctx.currentTime);
        filter.gain.setValueAtTime(voiceBoost ? 6 : 0, ctx.currentTime);
        source.connect(compressor);
        compressor.connect(filter);
        filter.connect(ctx.destination);
        audioCtxRef.current = ctx;
        sourceRef.current = source;
        compressorRef.current = compressor;
        voiceBoostRef.current = filter;
    } catch (e) {
        console.warn("Audio context bypass.");
    }
  }, [stableVolume, voiceBoost]);

  useEffect(() => {
      if (compressorRef.current && audioCtxRef.current) {
          const targetRatio = stableVolume ? 12 : 1;
          compressorRef.current.ratio.setTargetAtTime(targetRatio, audioCtxRef.current.currentTime, 0.1);
      }
  }, [stableVolume]);

  useEffect(() => {
    if (voiceBoostRef.current && audioCtxRef.current) {
        const targetGain = voiceBoost ? 8 : 0;
        voiceBoostRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.1);
    }
  }, [voiceBoost]);

  /**
   * SUBTITLE AND AUDIO TRACK LOADER
   */
  const loadMediaTracks = useCallback(() => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    
    // Audio Tracks
    // @ts-ignore
    const nativeAudio = v.audioTracks;
    let aTracks: AudioTrackMeta[] = [];
    if (nativeAudio && nativeAudio.length > 1) {
        for (let i = 0; i < nativeAudio.length; i++) {
            // Fix: Explicitly cast track to any to access properties safely on non-standard AudioTrack
            const track = nativeAudio[i] as any;
            aTracks.push({ 
                id: track.id, 
                label: track.label || `Track ${i + 1}`, 
                language: track.language, 
                enabled: track.enabled 
            });
        }
    } else {
        aTracks = [
            { id: '1', label: 'English (Original)', language: 'en', enabled: true },
            { id: '2', label: 'Hindi (Neural Dub)', language: 'hi', enabled: false }
        ];
    }
    setAudioTracks(aTracks);

    // Subtitle Tracks
    const nativeSubs = v.textTracks;
    let sTracks: SubtitleTrackMeta[] = [];
    if (nativeSubs && nativeSubs.length > 0) {
        for (let i = 0; i < nativeSubs.length; i++) {
            // Fix: Cast explicitly to any to resolve 'unknown' property access errors for language and mode
            const track = nativeSubs[i] as any;
            sTracks.push({
                id: i.toString(),
                label: track.label || `Language ${i + 1}`,
                // Fixed: Property 'language' is now correctly accessed after explicit any cast
                language: track.language,
                // Fixed: Property 'mode' is now correctly accessed after explicit any cast
                active: track.mode === 'showing'
            });
        }
    } else {
        const savedLang = localStorage.getItem('azkaartube_pref_sub');
        sTracks = [
            { id: 'none', label: 'Off', language: '', active: !savedLang },
            { id: 'en', label: 'English', language: 'en', active: savedLang === 'en' },
            { id: 'hi', label: 'Hindi (Auto)', language: 'hi', active: savedLang === 'hi' },
            { id: 'ja', label: 'Japanese', language: 'ja', active: savedLang === 'ja' }
        ];
        if (!sTracks.some(t => t.active)) sTracks[0].active = true;
    }
    setSubtitleTracks(sTracks);
    setIsCCon(sTracks.find(t => t.active)?.id !== 'none');
  }, [videoId]);

  const switchSubtitle = (trackId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = subtitleTracks.map(t => {
        const isMatch = t.id === trackId;
        if (isMatch && t.id !== 'none') localStorage.setItem('azkaartube_pref_sub', t.language);
        if (isMatch && t.id === 'none') localStorage.removeItem('azkaartube_pref_sub');
        return { ...t, active: isMatch };
    });
    setSubtitleTracks(updated);
    setIsCCon(trackId !== 'none');
    
    // Standard Track Toggling
    if (videoRef.current) {
        const tracks = videoRef.current.textTracks;
        for (let i = 0; i < tracks.length; i++) {
            // Fix: Cast explicitly to any to resolve mode property access issue on potential unknown type
            (tracks[i] as any).mode = 'disabled';
        }
        // In real DASH/HLS, we'd find by lang. Here we assume mock mapping or real tracks if present.
        // Fix: Explicitly cast Array.from result to any array to resolve language access issue on unknown type
        const target = (Array.from(tracks) as any[]).find(t => t.language === trackId);
        // Fix: Cast target to any to resolve mode property access issue on potential unknown type
        if (target) (target as any).mode = 'showing';
    }
    
    setActiveMenu('main');
  };

  const toggleCC = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isCCon) {
          switchSubtitle('none');
      } else {
          const lastLang = localStorage.getItem('azkaartube_pref_sub') || 'en';
          switchSubtitle(lastLang);
      }
  };

  const attemptPlay = useCallback(async () => {
    if (!videoRef.current) return;
    try {
        initAudioEngine();
        if (audioCtxRef.current?.state === 'suspended') {
            await audioCtxRef.current.resume();
        }
        playPromiseRef.current = videoRef.current.play();
        await playPromiseRef.current;
        playPromiseRef.current = null;
        setIsPlaying(true);
    } catch (error) {
        playPromiseRef.current = null;
    }
  }, [initAudioEngine]);

  const attemptPause = useCallback(async () => {
    if (!videoRef.current) return;
    if (playPromiseRef.current) {
        try { await playPromiseRef.current; } catch {}
    }
    videoRef.current.pause();
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (videoRef.current && videoId) {
        const lastPos = getWatchPosition(videoId);
        if (typeof lastPos === 'number' && isFinite(lastPos)) {
            videoRef.current.currentTime = lastPos;
        }
        if (autoplay) {
            attemptPlay();
        }
        loadMediaTracks();
    }
  }, [src, videoId, autoplay, loadMediaTracks, attemptPlay]);

  const switchAudioTrack = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    // @ts-ignore
    const nativeTracks = videoRef.current.audioTracks;
    if (nativeTracks) {
        for (let i = 0; i < nativeTracks.length; i++) {
            nativeTracks[i].enabled = nativeTracks[i].id === trackId;
        }
    }
    const updated = audioTracks.map(t => {
        const isMatch = t.id === trackId;
        if (isMatch && videoId) localStorage.setItem(`audio_pref_${videoId}`, t.language);
        return { ...t, enabled: isMatch };
    });
    setAudioTracks(updated);
    setShowSettings(false);
    setActiveMenu('main');
  };

  useEffect(() => {
      const interval = setInterval(() => {
          if (videoRef.current && videoId && !videoRef.current.paused) {
              const current = videoRef.current.currentTime;
              if (typeof current === 'number' && isFinite(current)) {
                saveWatchPosition(videoId, current);
              }
          }
      }, 5000);
      return () => clearInterval(interval);
  }, [videoId]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      const isPaused = videoRef.current.paused;
      if (isPaused) attemptPlay();
      else attemptPause();
      setPlaybackFeedback(isPaused ? 'play' : 'pause');
      setTimeout(() => setPlaybackFeedback(null), 500);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  }, [attemptPlay, attemptPause]);

  const triggerSeekFeedback = (dir: 'forward' | 'backward') => {
      setSeekFeedback(dir);
      setCumulativeSkip(prev => prev + 5);
      if (skipResetRef.current) window.clearTimeout(skipResetRef.current);
      skipResetRef.current = window.setTimeout(() => {
          setSeekFeedback(null);
          setCumulativeSkip(0);
          tapCountRef.current = 0;
      }, 800);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    if (showSettings) {
        setShowSettings(false);
        return;
    }
    const now = Date.now();
    const delta = now - lastTapRef.current;
    lastTapRef.current = now;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const x = e.clientX - containerRect.left;
    const width = containerRect.width;
    const isRapidTap = delta < 300 || (seekFeedback !== null && delta < 600);
    if (isRapidTap) {
        if (clickTimeoutRef.current) {
            window.clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
        const v = videoRef.current;
        if (!v || typeof v.duration !== 'number' || !isFinite(v.duration)) return;
        tapCountRef.current++;
        if (tapCountRef.current >= 2) {
            if (x < width * 0.4) {
                v.currentTime = Math.max(0, v.currentTime - 5);
                triggerSeekFeedback('backward');
                if (navigator.vibrate) navigator.vibrate([15, 10]);
            } else if (x > width * 0.6) {
                v.currentTime = Math.min(v.duration, v.currentTime + 5);
                triggerSeekFeedback('forward');
                if (navigator.vibrate) navigator.vibrate([15, 10]);
            }
        }
    } else {
        tapCountRef.current = 1;
        clickTimeoutRef.current = window.setTimeout(() => {
            togglePlay();
            clickTimeoutRef.current = null;
            tapCountRef.current = 0;
        }, 250);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v && !isDragging) {
      const current = v.currentTime;
      const total = v.duration;
      if (typeof total === 'number' && isFinite(total) && total > 0) {
        setProgress((current / total) * 100);
        setCurrentTimeSec(current);
        setDurationSec(total);
      }
    }
  };

  const formatTime = (time: number) => {
    if (typeof time !== 'number' || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeek = (clientX: number) => {
    const v = videoRef.current;
    if (v && progressBarRef.current) {
        const rect = progressBarRef.current.getBoundingClientRect();
        if (rect.width <= 0) return;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const clickedPct = x / rect.width;
        const total = v.duration;
        if (typeof total === 'number' && isFinite(total)) {
            const newTime = clickedPct * total;
            if (isFinite(newTime)) {
                v.currentTime = newTime;
                setCurrentTimeSec(newTime);
                setProgress(clickedPct * 100);
            }
        }
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDragging(true);
      handleSeek(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
      const v = videoRef.current;
      if (progressBarRef.current && v && typeof v.duration === 'number' && isFinite(v.duration)) {
          const rect = progressBarRef.current.getBoundingClientRect();
          if (rect.width <= 0) return;
          const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
          const pct = x / rect.width;
          setHoverTime({ time: pct * v.duration, x: e.clientX - rect.left });
          if (isDragging) handleSeek(e.clientX);
      }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const toggleFullscreen = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!containerRef.current) return;
      if (document.fullscreenElement) document.exitFullscreen();
      else containerRef.current.requestFullscreen();
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-black group overflow-hidden select-none font-sans transition-all duration-500 ${isPlaying && ambientMode ? 'shadow-[0_0_100px_rgba(123,92,255,0.15)]' : ''}`}
      onMouseMove={() => {
          setShowControls(true);
          if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = window.setTimeout(() => isPlaying && !showSettings && setShowControls(false), 3000);
      }}
      onMouseLeave={() => { if(isPlaying && !showSettings) setShowControls(false); setHoverTime(null); }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        crossOrigin="anonymous"
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={loadMediaTracks}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      <div className="absolute inset-0 z-[65] cursor-pointer" onClick={handleVideoClick} />

      {playbackFeedback && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[70]">
              <div className="p-12 bg-black/40 backdrop-blur-md rounded-full animate-youtube-pop">
                  {playbackFeedback === 'play' ? <Play size={80} className="text-white fill-white ml-2" /> : <Pause size={80} className="text-white fill-white" />}
              </div>
          </div>
      )}

      {seekFeedback === 'backward' && (
          <div className="absolute inset-y-0 left-0 w-1/3 flex items-center justify-center pointer-events-none z-[60] bg-gradient-to-r from-white/15 to-transparent">
              <div className="flex flex-col items-center gap-5 animate-yt-ripple-left">
                  <div className="w-28 h-28 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
                      <div className="flex gap-[-8px]">
                        <ChevronLeft size={42} className="text-white fill-white -mr-6 opacity-30" />
                        <ChevronLeft size={48} className="text-white fill-white -mr-6 opacity-60" />
                        <ChevronLeft size={52} className="text-white fill-white" />
                      </div>
                  </div>
                  <div className="flex flex-col items-center drop-shadow-2xl">
                    <span className="text-white font-black text-4xl">-{cumulativeSkip}s</span>
                  </div>
              </div>
          </div>
      )}
      {seekFeedback === 'forward' && (
          <div className="absolute inset-y-0 right-0 w-1/3 flex items-center justify-center pointer-events-none z-[60] bg-gradient-to-l from-white/15 to-transparent">
              <div className="flex flex-col items-center gap-5 animate-yt-ripple-right">
                  <div className="w-28 h-28 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
                      <div className="flex gap-[-8px]">
                        <ChevronRight size={52} className="text-white fill-white" />
                        <ChevronRight size={48} className="text-white fill-white -ml-6 opacity-60" />
                        <ChevronRight size={42} className="text-white fill-white -ml-6 opacity-30" />
                      </div>
                  </div>
                  <div className="flex flex-col items-center drop-shadow-2xl">
                    <span className="text-white font-black text-4xl">+{cumulativeSkip}s</span>
                  </div>
              </div>
          </div>
      )}

      <div className={`absolute inset-0 z-[70] flex flex-col justify-end transition-opacity duration-300 pointer-events-none ${showControls || isDragging || showSettings ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
        <div className="relative px-3 pb-3 flex flex-col pointer-events-auto">
            <div ref={progressBarRef} className="relative w-full h-12 group/progress cursor-pointer flex items-end mb-1" onMouseDown={onMouseDown} onMouseMove={onMouseMove}>
                {hoverTime && (
                    <div className="absolute bottom-10 px-2 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg text-[11px] font-black text-white pointer-events-none -translate-x-1/2 animate-in fade-in slide-in-from-bottom-1" style={{ left: `${hoverTime.x}px` }}>
                        {formatTime(hoverTime.time)}
                    </div>
                )}
                <div className="absolute bottom-6 left-0 right-0 h-8 pointer-events-none opacity-0 group-hover/progress:opacity-40 transition-opacity">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full fill-none stroke-white stroke-[0.3]">
                        <path d={heatmapPath} />
                    </svg>
                </div>
                <div className="relative w-full h-[4px] group-hover/progress:h-[8px] flex gap-[2px] transition-all items-center bg-white/10">
                    {chapters.map((chapter, i) => {
                        const nextTime = chapters[i + 1]?.startTime || durationSec;
                        const segmentDuration = nextTime - chapter.startTime;
                        const widthPct = (segmentDuration / (durationSec || 1)) * 100;
                        const segmentElapsed = Math.max(0, Math.min(segmentDuration, currentTimeSec - chapter.startTime));
                        const segmentProgressPct = (segmentElapsed / segmentDuration) * 100;
                        return (
                            <div key={i} className="h-full bg-white/5 relative flex-1 overflow-hidden rounded-full" style={{ flexGrow: widthPct }}>
                                <div className="h-full transition-none" style={{ width: `${segmentProgressPct}%`, backgroundColor: '#7B5CFF', boxShadow: '0 0 12px #7B5CFF99' }} />
                            </div>
                        );
                    })}
                </div>
                <div className={`absolute bottom-0 w-4 h-4 rounded-full transition-transform z-20 pointer-events-none -translate-x-1/2 -translate-y-[-2px] ${isDragging ? 'scale-125' : 'scale-0 group-hover/progress:scale-100'}`} style={{ left: `${progress}%`, backgroundColor: '#7B5CFF', boxShadow: '0 0 15px #7B5CFF', border: '2px solid white' }} />
            </div>

            <div className="flex items-center justify-between h-12">
                <div className="flex items-center gap-2 md:gap-5">
                    <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:opacity-90 transition-opacity">
                        {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-0.5" />}
                    </button>
                    <button onClick={(e) => e.stopPropagation()} className="text-white hover:opacity-90 transition-opacity"><SkipForward size={22} fill="white" /></button>
                    <div className="flex items-center gap-1 group/vol" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="text-white">{isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
                        <div className="w-0 group-hover/vol:w-20 transition-all duration-300 overflow-hidden flex items-center h-full">
                            <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 h-1 bg-white/30 accent-white rounded-full cursor-pointer ml-2" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] font-medium text-white tracking-tight ml-2">
                        <span>{formatTime(currentTimeSec)} / {formatTime(durationSec)}</span>
                        <div className="hidden sm:flex items-center gap-1.5 ml-2 hover:opacity-80 cursor-pointer transition-opacity">
                            <span className="font-bold">{activeChapter}</span>
                            <ChevronRight size={16} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-4">
                    <div className="flex items-center mr-1">
                        <button onClick={(e) => { e.stopPropagation(); setIsAutoplayOn(!isAutoplayOn); }} className={`w-9 h-5 rounded-full relative p-0.5 transition-colors ${isAutoplayOn ? 'bg-[#7B5CFF]' : 'bg-white/10'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full flex items-center justify-center transition-transform ${isAutoplayOn ? 'translate-x-4' : 'translate-x-0'}`}><Play size={8} fill="black" stroke="none" className="ml-0.5" /></div>
                        </button>
                    </div>
                    <button onClick={(e) => toggleCC(e)} className={`w-8 h-6 border-2 rounded-sm flex items-center justify-center text-[10px] font-black tracking-tighter transition-all ${isCCon ? 'bg-[#7B5CFF] border-[#7B5CFF] text-white' : 'border-white/80 text-white/80 hover:bg-white/10'}`}>CC</button>
                    
                    <div className="relative pointer-events-auto">
                        <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setActiveMenu('main'); }} className="relative p-1 text-white/90 hover:opacity-100 group">
                            <Settings size={22} className={`transition-transform duration-500 ${showSettings ? 'rotate-90' : 'group-hover:rotate-45'}`} />
                            <div className="absolute -top-1 -right-1.5 bg-[#FF0000] text-[7px] font-black px-0.5 rounded-[1px] text-white leading-none shadow-sm">HD</div>
                        </button>
                        
                        {showSettings && (
                            <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-full right-0 mb-4 w-[310px] bg-black/90 backdrop-blur-[40px] border border-white/10 rounded-[2rem] p-2 shadow-[0_40px_120px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-300 pointer-events-auto z-[80]"
                            >
                                {activeMenu === 'main' ? (
                                    <>
                                        <SettingRow icon={Activity} label="Stable Volume" hasToggle checked={stableVolume} onClick={(e: any) => { setStableVolume(!stableVolume); }} />
                                        <SettingRow icon={Volume1} label="Voice boost" hasToggle checked={voiceBoost} onClick={(e: any) => { setVoiceBoost(!voiceBoost); }} />
                                        <SettingRow icon={Sun} label="Ambient mode" hasToggle checked={ambientMode} onClick={() => setAmbientMode(!ambientMode)} />
                                        <div className="h-px bg-white/5 my-1 mx-2" />
                                        {audioTracks.length > 1 && <SettingRow icon={AudioLines} label="Audio track" value={activeAudioTrack} onClick={() => setActiveMenu('audio')} />}
                                        <SettingRow icon={Captions} label="Subtitles/CC" value={activeSubtitle} onClick={() => setActiveMenu('subtitles')} />
                                        <SettingRow icon={Timer} label="Sleep timer" value={activeSleepTimer} onClick={() => setActiveMenu('timer')} />
                                        <SettingRow icon={Gauge} label="Playback speed" value={playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x`} onClick={() => setActiveMenu('speed')} />
                                        <SettingRow icon={Sliders} label="Quality" value={activeQuality} onClick={() => setActiveMenu('quality')} />
                                    </>
                                ) : activeMenu === 'audio' ? (
                                    <div className="py-2">
                                        <button onClick={() => { setActiveMenu('main'); }} className="w-full flex items-center gap-3 p-3 text-white/50 hover:text-white transition-colors">
                                            <ChevronLeft size={20}/> <span className="font-black text-[11px] uppercase tracking-[0.3em]">Audio Transmissions</span>
                                        </button>
                                        <div className="mt-2 space-y-1">
                                            {audioTracks.map(track => (
                                                <button key={track.id} onClick={(e) => switchAudioTrack(track.id, e)} className="w-full flex items-center justify-between p-3.5 px-6 hover:bg-white/10 rounded-2xl transition-all group">
                                                    <div className="flex items-center gap-3"><Languages size={14} className="text-white/20 group-hover:text-[#7B5CFF] transition-colors" /><span className="text-[14px] font-bold text-white tracking-tight">{track.label}</span></div>
                                                    {track.enabled && <Check size={18} className="text-[#7B5CFF]" strokeWidth={4} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : activeMenu === 'subtitles' ? (
                                    <div className="py-2">
                                        <button onClick={() => { setActiveMenu('main'); }} className="w-full flex items-center gap-3 p-3 text-white/50 hover:text-white transition-colors">
                                            <ChevronLeft size={20}/> <span className="font-black text-[11px] uppercase tracking-[0.3em]">Neural CC Hub</span>
                                        </button>
                                        <div className="mt-2 space-y-1">
                                            {subtitleTracks.map(track => (
                                                <button key={track.id} onClick={(e) => switchSubtitle(track.id, e)} className="w-full flex items-center justify-between p-3.5 px-6 hover:bg-white/10 rounded-2xl transition-all group">
                                                    <div className="flex items-center gap-3"><Type size={14} className="text-white/20 group-hover:text-[#7B5CFF] transition-colors" /><span className="text-[14px] font-bold text-white tracking-tight">{track.label}</span></div>
                                                    {track.active && <Check size={18} className="text-[#7B5CFF]" strokeWidth={4} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : activeMenu === 'speed' ? (
                                    <div className="py-2">
                                        <button onClick={() => { setActiveMenu('main'); }} className="w-full flex items-center gap-3 p-3 text-white/50 hover:text-white transition-colors">
                                            <ChevronLeft size={20}/> <span className="font-black text-[11px] uppercase tracking-[0.3em]">Velocity Protocol</span>
                                        </button>
                                        <div className="mt-2 space-y-1">
                                            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                                                <button key={s} onClick={(e) => { e.stopPropagation(); setPlaybackSpeed(s); if(videoRef.current) videoRef.current.playbackRate = s; setActiveMenu('main'); }} className="w-full flex items-center justify-between p-3.5 px-6 hover:bg-white/10 rounded-2xl transition-all">
                                                    <span className="text-[14px] font-bold text-white tracking-tight">{s === 1 ? 'Normal' : `${s}x`}</span>
                                                    {playbackSpeed === s && <Check size={18} className="text-[#7B5CFF]" strokeWidth={4} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : activeMenu === 'quality' ? (
                                    <div className="py-2">
                                        <button onClick={() => { setActiveMenu('main'); }} className="w-full flex items-center gap-3 p-3 text-white/50 hover:text-white transition-colors">
                                            <ChevronLeft size={20}/> <span className="font-black text-[11px] uppercase tracking-[0.3em]">Resolution Grid</span>
                                        </button>
                                        <div className="mt-2 space-y-1">
                                            {availableQualities.map(q => (
                                                <button key={q} onClick={(e) => handleQualityChange(q, e)} className="w-full flex items-center justify-between p-3.5 px-6 hover:bg-white/10 rounded-2xl transition-all">
                                                    <span className="text-[14px] font-bold text-white tracking-tight">{q}</span>
                                                    {activeQuality === q && <Check size={18} className="text-[#7B5CFF]" strokeWidth={4} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : activeMenu === 'timer' ? (
                                    <div className="py-2">
                                        <button onClick={() => { setActiveMenu('main'); }} className="w-full flex items-center gap-3 p-3 text-white/50 hover:text-white transition-colors">
                                            <ChevronLeft size={20}/> <span className="font-black text-[11px] uppercase tracking-[0.3em]">Neural Sleep Timer</span>
                                        </button>
                                        <div className="mt-2 space-y-1">
                                            {['Off', '10 minutes', '15 minutes', '30 minutes', '45 minutes', '60 minutes', 'End of video'].map(time => (
                                                <button key={time} onClick={(e) => { e.stopPropagation(); setActiveSleepTimer(time); setActiveMenu('main'); }} className="w-full flex items-center justify-between p-3.5 px-6 hover:bg-white/10 rounded-2xl transition-all group">
                                                    <div className="flex items-center gap-3"><Moon size={14} className="text-white/20 group-hover:text-brand transition-colors" /><span className="text-[14px] font-bold text-white tracking-tight">{time}</span></div>
                                                    {activeSleepTimer === time && <Check size={18} className="text-[#7B5CFF]" strokeWidth={4} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); }} className="p-1 text-white/90 hover:opacity-100"><PictureInPicture2 size={22} /></button>
                    <button onClick={(e) => toggleFullscreen(e)} className="p-1 text-white/90 hover:opacity-100"><Maximize size={24} /></button>
                </div>
            </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            @keyframes youtube-pop {
                0% { transform: scale(0.6); opacity: 0; }
                20% { transform: scale(1.1); opacity: 1; }
                80% { transform: scale(1); opacity: 1; }
                100% { transform: scale(1.2); opacity: 0; }
            }
            .animate-youtube-pop { animation: youtube-pop 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
            @keyframes yt-ripple-left {
                0% { transform: translateX(-40px) scale(0.85); opacity: 0; }
                30% { transform: translateX(-15px) scale(1); opacity: 1; }
                100% { transform: translateX(-80px) scale(1.8); opacity: 0; }
            }
            @keyframes yt-ripple-right {
                0% { transform: translateX(40px) scale(0.85); opacity: 0; }
                30% { transform: translateX(15px) scale(1); opacity: 1; }
                100% { transform: translateX(80px) scale(1.8); opacity: 0; }
            }
            .animate-yt-ripple-left { animation: yt-ripple-left 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            .animate-yt-ripple-right { animation: yt-ripple-right 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}} />
    </div>
  );
}
