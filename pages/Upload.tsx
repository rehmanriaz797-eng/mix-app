
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload as UploadIcon, X, Check, CheckCircle2, 
  HelpCircle, MonitorPlay, Copy, Calendar, 
  Image as ImageIcon, ListPlus, Subtitles, Info,
  ChevronRight, ChevronLeft, Zap, Sparkles, ShieldCheck,
  ShieldAlert, Globe, Lock, Eye, AlertCircle, Loader2,
  FileWarning, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadVideo, generateThumbnail } from '../services/storageService';
import { Video } from '../types';

type Step = 'Details' | 'Elements' | 'Checks' | 'Visibility';
type UploadType = 'video' | 'short';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Core State ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(true);
  const [uploadType, setUploadType] = useState<UploadType>('video');
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [checkProgress, setCheckProgress] = useState(0);
  const [isChecksDone, setIsChecksDone] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Video Metadata State
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    audience: 'not-kids' as 'kids' | 'not-kids',
    visibility: 'public' as 'private' | 'unlisted' | 'public',
    tags: '',
  });
  
  const [isPublishing, setIsPublishing] = useState(false);
  const steps: Step[] = ['Details', 'Elements', 'Checks', 'Visibility'];
  const videoPreviewUrl = file ? URL.createObjectURL(file) : '';

  // Validation Logic
  const validateAspectRatio = (width: number, height: number, type: UploadType): boolean => {
      const ratio = width / height;
      if (type === 'short') {
          // Shorts must be 9:16 (~0.56) or 1:1 (1.0)
          return (Math.abs(ratio - (9/16)) < 0.05) || (Math.abs(ratio - 1) < 0.05);
      } else {
          // Regular videos allow anything, but thumbnails have specific rules later
          return true;
      }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      
      // Real-time Ratio Detection
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          const { videoWidth, videoHeight } = video;
          const isActuallyShort = videoHeight > videoWidth || videoHeight === videoWidth;
          
          if (uploadType === 'short' && !validateAspectRatio(videoWidth, videoHeight, 'short')) {
              setValidationError("Invalid Ratio: Shorts must be vertical (9:16) or square (1:1).");
              return;
          }

          setFile(selected);
          setIsUploadModalOpen(false);
          setVideoData(prev => ({ ...prev, title: selected.name.replace(/\.[^/.]+$/, "") }));
          
          generateThumbnail(selected).then(thumb => {
              setVideoData(prev => ({ ...prev, thumbnail: thumb }));
          });
      };
      video.src = URL.createObjectURL(selected);
    }
  };

  const handleThumbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValidationError(null);
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                  const ratio = img.width / img.height;
                  
                  if (uploadType === 'short') {
                      if (!(Math.abs(ratio - (9/16)) < 0.1 || Math.abs(ratio - 1) < 0.1)) {
                          setValidationError("Shorts thumbnails must match video ratio (9:16 or 1:1).");
                          return;
                      }
                  } else {
                      if (Math.abs(ratio - (16/9)) > 0.1) {
                          setValidationError("Regular video thumbnails must be widescreen (16:9).");
                          return;
                      }
                  }
                  setVideoData(prev => ({ ...prev, thumbnail: event.target?.result as string }));
              };
              img.src = event.target?.result as string;
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  useEffect(() => {
    if (!file) return;
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) { clearInterval(uploadInterval); return 100; }
        return prev + Math.random() * 20; 
      });
    }, 150);
    if (currentStep > 0 && !isChecksDone) {
        const checkInterval = setInterval(() => {
            setCheckProgress(prev => {
                if (prev >= 100) { clearInterval(checkInterval); setIsChecksDone(true); return 100; }
                return prev + 10;
            });
        }, 200);
        return () => clearInterval(checkInterval);
    }
    return () => clearInterval(uploadInterval);
  }, [file, currentStep, isChecksDone]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      scrollContainerRef.current?.scrollTo(0, 0);
    } else {
      handleFinalPublish();
    }
  };

  const handleFinalPublish = async () => {
    if (!file || isPublishing) return;
    setIsPublishing(true);
    
    const payload = {
        ...videoData,
        isShort: uploadType === 'short',
        videoUrl: videoPreviewUrl,
        duration: uploadType === 'short' ? '0:15' : '10:00',
        views: '0 views',
        postedAt: 'Just now',
        tags: videoData.tags.split(',').map(t => t.trim()),
        profiles: { username: 'You', avatar_url: 'https://picsum.photos/seed/me/100' }
    };

    await uploadVideo(payload);
    navigate('/');
  };

  if (isUploadModalOpen) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#020617] flex items-center justify-center p-4">
        <div className="bg-[#05081a] w-full max-w-4xl h-auto min-h-[600px] rounded-[3rem] shadow-2xl border border-white/5 flex flex-col overflow-hidden animate-in zoom-in duration-300">
          <div className="flex justify-between items-center p-8 border-b border-white/5">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Upload Center</h2>
            <button onClick={() => navigate('/')} className="text-slate-500 hover:text-white p-2 rounded-xl transition-all"><X size={28} /></button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="flex gap-4 mb-10 bg-white/5 p-2 rounded-[2rem] border border-white/5">
                <button 
                    onClick={() => {setUploadType('video'); setValidationError(null);}}
                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadType === 'video' ? 'bg-brand text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
                >Regular Video</button>
                <button 
                    onClick={() => {setUploadType('short'); setValidationError(null);}}
                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadType === 'short' ? 'bg-red-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
                >Shorts / Reel</button>
            </div>

            <div 
                className={`w-40 h-40 bg-white/5 rounded-[3rem] border-2 border-dashed flex items-center justify-center mb-8 cursor-pointer transition-all group ${validationError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 hover:border-brand/40'}`}
                onClick={() => fileInputRef.current?.click()}
            >
              {validationError ? <AlertTriangle size={60} className="text-red-500 animate-pulse" /> : <UploadIcon size={60} className="text-slate-700 group-hover:text-brand transition-all" />}
            </div>

            {validationError ? (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in shake">
                    <p className="text-red-400 text-sm font-black uppercase tracking-widest italic">{validationError}</p>
                </div>
            ) : (
                <div className="mb-8">
                    <p className="text-white text-xl font-bold mb-2">Select {uploadType === 'short' ? 'Vertical' : 'Horizontal'} Video</p>
                    <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">Rule: {uploadType === 'short' ? '9:16 or 1:1 Ratio Required' : 'All Ratios Allowed'}</p>
                </div>
            )}
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-black font-black px-12 py-4 rounded-xl text-[11px] uppercase tracking-[0.3em] hover:bg-brand hover:text-white transition-all shadow-xl"
            >Choose File</button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="video/*" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[#020617] flex items-center justify-center p-2 sm:p-6">
      <div className="bg-[#05081a] w-full h-full max-w-6xl md:h-[85vh] md:rounded-[3rem] shadow-2xl flex flex-col border border-white/5 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
        
        <div className="flex justify-between items-center px-10 py-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex flex-col">
              <h2 className="text-lg font-black text-white truncate max-w-[250px] uppercase italic tracking-tighter">{videoData.title || "Processing..."}</h2>
              <span className="text-[9px] text-brand font-black uppercase tracking-widest mt-1">{uploadType === 'short' ? 'SHORTS NODE' : 'VIDEO BROADCAST'} ACTIVE</span>
          </div>
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-500"><X size={24} /></button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar pb-32" ref={scrollContainerRef}>
            {currentStep === 0 && (
              <div className="space-y-12 max-w-2xl animate-in slide-in-from-right-4">
                <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Identity</h3>

                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Broadcast Title</label>
                        <input value={videoData.title} onChange={e => setVideoData({...videoData, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-2xl p-6 focus:border-brand outline-none text-white font-black text-xl shadow-inner" placeholder="Name your signal..." />
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Visual Key (Thumbnail)</h4>
                        {validationError && <p className="text-red-500 text-[10px] font-bold uppercase ml-2 animate-pulse">{validationError}</p>}
                        <div className="flex gap-5">
                            <div 
                                onClick={() => thumbInputRef.current?.click()}
                                className={`w-44 h-24 bg-white/5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${validationError ? 'border-red-500' : 'border-white/10 hover:border-brand/40'}`}
                            >
                                {videoData.thumbnail ? <img src={videoData.thumbnail} className="w-full h-full object-cover" /> : <ImageIcon size={28} className="text-slate-600" />}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">Rule: {uploadType === 'short' ? 'Must be Vertical/Square' : 'Must be 16:9'}</p>
                            </div>
                            <input type="file" ref={thumbInputRef} onChange={handleThumbUpload} className="hidden" accept="image/*" />
                        </div>
                    </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
                <div className="space-y-12 max-w-2xl animate-in slide-in-from-right-4">
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Neural Scan</h3>
                    <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-3xl bg-brand/10 text-brand flex items-center justify-center">
                                    {isChecksDone ? <ShieldCheck size={32} /> : <Loader2 size={32} className="animate-spin" />}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-white uppercase italic">Integrity Check</h4>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Digital Rights Protocol</p>
                                </div>
                            </div>
                            <span className="text-2xl font-black text-brand italic">{Math.round(checkProgress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-10">
                            <div className="h-full bg-brand transition-all duration-500" style={{ width: `${checkProgress}%` }}></div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Step 1 and 3 are standard placeholders based on previous implementation */}
            {(currentStep === 1 || currentStep === 3) && <div className="text-white p-10 opacity-50 uppercase font-black italic">Next Protocol Step Loading...</div>}
          </div>

          <div className="hidden lg:flex w-[420px] bg-black/40 backdrop-blur-3xl border-l border-white/5 flex-col p-8 gap-8">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Signal Monitor</div>
                <div className={`relative aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10`}>
                    <video src={videoPreviewUrl} className="w-full h-full object-cover opacity-60" muted loop autoPlay />
                </div>
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">File Type</span>
                        <span className="text-brand">{uploadType.toUpperCase()}</span>
                    </div>
                </div>
          </div>
        </div>

        <div className="border-t border-white/5 p-8 bg-black/80 backdrop-blur-2xl z-30 flex items-center justify-between px-10">
            <button onClick={() => currentStep === 0 ? setIsUploadModalOpen(true) : setCurrentStep(c => c - 1)} className="px-8 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">{currentStep === 0 ? 'Abort' : 'Back'}</button>
            <button 
                onClick={handleNext} 
                disabled={(currentStep === 0 && !videoData.title) || (currentStep === 2 && !isChecksDone) || !!validationError}
                className="bg-brand text-white font-black uppercase text-[11px] tracking-[0.4em] px-12 py-5 rounded-[2rem] shadow-xl shadow-brand/20 hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-30"
            >
                {currentStep === 3 ? (isPublishing ? 'Synchronizing...' : 'Authorize Broadcast') : 'Next Protocol'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Upload;
