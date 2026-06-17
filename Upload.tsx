
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload as UploadIcon, X, Check, CheckCircle2, 
  HelpCircle, MonitorPlay, Copy, Calendar, 
  Image as ImageIcon, ListPlus, Subtitles, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadVideo, generateThumbnail } from '../services/storageService';
import { supabase } from '../services/supabase';
import { Video } from '../types';

type Step = 'details' | 'elements' | 'checks' | 'visibility';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- State ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [generatedThumb, setGeneratedThumb] = useState<string>('');
  
  // Form Data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<'kids' | 'not-kids' | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>('public');
  const [tags, setTags] = useState('');
  const [showMore, setShowMore] = useState(false);
  
  // Elements State
  const [elements, setElements] = useState({
      subtitles: false,
      endScreen: false,
      cards: false
  });
  const [activeElementModal, setActiveElementModal] = useState<'subtitles' | 'endScreen' | 'cards' | null>(null);

  // Scheduling State
  const [isSchedule, setIsSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  // Computed
  const steps: Step[] = ['details', 'elements', 'checks', 'visibility'];
  const videoUrl = file ? URL.createObjectURL(file) : '';
  const shortLink = `https://youtu.be/${Math.random().toString(36).substring(7)}`;

  // --- Effects ---

  useEffect(() => {
    if (!file) return;

    // Fast Upload Simulation
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          return 100;
        }
        return prev + 15; 
      });
    }, 50); 

    return () => {
      clearInterval(uploadInterval);
    };
  }, [file]);

  // --- Handlers ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
      setIsUploadModalOpen(false); 
      
      try {
        const thumb = await generateThumbnail(selected);
        setGeneratedThumb(thumb);
      } catch (err) {
        console.error("Thumbnail gen failed", err);
      }
    }
  };

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            if(ev.target?.result) setGeneratedThumb(ev.target.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      scrollContainerRef.current?.scrollTo(0, 0);
    } else {
      handlePublish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handlePublish = async () => {
    if (!file) return;

    setProcessingProgress(10);
    
    try {
        const thumbPromise = (async () => {
            let tUrl = generatedThumb;
            if (generatedThumb && generatedThumb.startsWith('data:')) {
                try {
                    const res = await fetch(generatedThumb);
                    const blob = await res.blob();
                    const fileName = `thumbnails/${Date.now()}_thumb.jpg`;
                    const { data, error } = await supabase.storage.from('media').upload(fileName, blob);
                    if (!error && data) {
                        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
                        tUrl = publicUrl;
                    }
                } catch (e) { console.warn("Thumb upload failed, using local fallback"); }
            }
            return tUrl;
        })();

        const videoPromise = (async () => {
            let vUrl = videoUrl;
            if (file) {
                const fileName = `videos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                try {
                    const { data, error } = await supabase.storage.from('media').upload(fileName, file);
                    if (!error && data) {
                        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
                        vUrl = publicUrl;
                    }
                } catch (e) { console.warn("Video upload failed, using local fallback"); }
            }
            return vUrl;
        })();

        setProcessingProgress(30);
        const [thumbUrl, finalVideoUrl] = await Promise.all([thumbPromise, videoPromise]);
        setProcessingProgress(80);

        // Fixed naming inconsistency to match Video interface
        const newVideo: Partial<Video> = {
            title: title || 'Untitled Video',
            description,
            thumbnailUrl: thumbUrl || generatedThumb,
            videoUrl: finalVideoUrl || videoUrl,
            duration: '0:30', 
            views: '0 views',
            channelName: 'You',
            channelAvatarUrl: 'https://picsum.photos/seed/me/100',
            postedAt: isSchedule && scheduleDate ? `Scheduled for ${scheduleDate}` : 'Just now',
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        };

        await uploadVideo(newVideo);
        setProcessingProgress(100);
        
        navigate('/');

    } catch (error) {
        console.error("Publish critical error", error);
        alert("An unexpected error occurred. Check console.");
        setProcessingProgress(0);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortLink);
  };

  const isStepValid = () => {
      if (currentStep === 0) {
          return title.trim().length > 0 && audience !== null;
      }
      return true;
  };

  if (isUploadModalOpen) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#1f1f1f] flex items-center justify-center font-sans">
        <div className="bg-[#282828] w-full h-full md:w-[960px] md:h-[600px] md:rounded-xl shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center p-6 border-b border-[#ffffff1a]">
            <h2 className="text-xl font-medium text-white">Upload videos</h2>
            <button onClick={() => navigate('/')} className="text-[#aaaaaa] hover:text-white p-2 rounded-full hover:bg-[#ffffff1a]"><X /></button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div 
                className="w-32 h-32 bg-[#1f1f1f] rounded-full flex items-center justify-center mb-6 cursor-pointer hover:bg-[#303030] transition-colors group" 
                onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon size={64} className="text-[#909090] group-hover:text-white transition-colors -mt-2" />
            </div>
            <p className="text-white text-[15px] mb-2 font-medium">Drag and drop video files to upload</p>
            <p className="text-[#aaaaaa] text-sm mb-8 px-8">Your videos will be private until you publish them.</p>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#3ea6ff] text-[#0f0f0f] font-semibold px-4 py-2.5 rounded-[2px] text-sm hover:bg-[#65b8ff] transition-colors uppercase"
            >
              Select files
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="video/*" />
          </div>

          <div className="p-6 text-center text-xs text-[#aaaaaa]">
            <p className="mb-1">By submitting your videos to YouTube, you acknowledge that you agree to YouTube's Terms of Service and Community Guidelines.</p>
            <p>Please be sure not to violate others' copyright or privacy rights.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center font-sans">
      <div className="bg-[#282828] w-full h-[100dvh] md:h-[90vh] md:max-w-[1200px] md:rounded-xl shadow-2xl flex flex-col border border-[#ffffff1a] animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative">
        
        <div className="flex justify-between items-center px-4 md:px-6 py-4 border-b border-[#ffffff1a] bg-[#282828] z-20">
          <div className="flex flex-col">
              <h2 className="text-lg md:text-xl font-medium text-white truncate max-w-[200px] md:max-w-[400px]" title={title}>{title}</h2>
              <span className="text-xs text-[#aaaaaa] md:hidden">Step {currentStep + 1} of 4</span>
          </div>
          
          <div className="hidden md:flex items-center gap-0">
             {steps.map((s, idx) => {
               const isActive = idx === currentStep;
               const isDone = idx < currentStep;
               return (
                 <div key={s} className="flex items-center">
                   <div className="flex flex-col items-center relative group cursor-default">
                     <div className={`w-2 h-2 rounded-full mb-2 transition-colors ${isActive ? 'bg-[#3ea6ff] ring-4 ring-[#3ea6ff]/20' : (isDone ? 'bg-[#3ea6ff]' : 'bg-[#aaaaaa]')}`}></div>
                     <span className={`text-[10px] md:text-xs font-medium uppercase absolute top-4 w-24 text-center ${isActive ? 'text-white' : (isDone ? 'text-white' : 'text-[#aaaaaa]')}`}>
                       {s}
                     </span>
                   </div>
                   {idx < steps.length - 1 && (
                     <div className={`h-[1px] w-16 md:w-24 mb-2 mx-1 transition-colors ${isDone ? 'bg-[#3ea6ff]' : 'bg-[#ffffff1a]'}`}></div>
                   )}
                 </div>
               )
             })}
          </div>

          <div className="flex items-center gap-2">
             <button onClick={() => navigate('/')} className="text-[#aaaaaa] hover:text-white p-2 rounded-full hover:bg-[#ffffff1a]"><X /></button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative bg-[#1f1f1f] lg:bg-[#282828]">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-24 lg:pb-8" ref={scrollContainerRef}>
            {currentStep === 0 && (
              <div className="space-y-6 max-w-[800px] mx-auto lg:mx-0 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center mb-2">
                     <h3 className="text-xl font-medium text-white">Details</h3>
                     <button className="text-[#3ea6ff] text-sm font-medium uppercase hover:text-[#65b8ff] hidden sm:block">Reuse details</button>
                </div>

                <div className={`relative group border rounded-[4px] px-3 py-2 bg-[#282828] transition-colors ${!title && 'border-red-500'} focus-within:border-[#3ea6ff] border-[#505050]`}>
                    <label className="text-xs text-[#aaaaaa] block mb-1">Title (required)</label>
                    <input 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-transparent outline-none text-white text-[15px] placeholder-[#717171]"
                      placeholder="Add a title that describes your video"
                      maxLength={100}
                    />
                    <div className="text-right text-xs text-[#aaaaaa] mt-1">{title.length}/100</div>
                </div>

                <div className="relative group border border-[#505050] rounded-[4px] px-3 py-2 bg-[#282828] focus-within:border-[#3ea6ff] transition-colors">
                    <label className="text-xs text-[#aaaaaa] block mb-1">Description</label>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-transparent outline-none text-white text-[15px] resize-none h-32 placeholder-[#717171]"
                      placeholder="Tell viewers about your video"
                      maxLength={5000}
                    />
                    <div className="text-right text-xs text-[#aaaaaa] mt-1">{description.length}/5000</div>
                </div>

                <div className="space-y-2">
                    <h4 className="font-medium text-[15px] text-white">Thumbnail</h4>
                    <p className="text-xs text-[#aaaaaa]">Select or upload a picture that shows what's in your video.</p>
                    <div className="flex flex-wrap gap-4 mt-2">
                        <div 
                            onClick={() => thumbInputRef.current?.click()}
                            className="w-32 h-20 border border-dashed border-[#505050] flex flex-col items-center justify-center cursor-pointer hover:bg-[#383838] transition-colors rounded-[2px] bg-[#282828]"
                        >
                            <ImageIcon size={20} className="text-[#aaaaaa] mb-1" />
                            <span className="text-xs text-[#aaaaaa]">Upload file</span>
                        </div>
                        <input type="file" ref={thumbInputRef} onChange={handleThumbSelect} className="hidden" accept="image/*" />
                        {generatedThumb ? (
                             <div className="w-32 h-20 border-2 border-white cursor-pointer relative rounded-[2px] overflow-hidden">
                                <img src={generatedThumb} className="w-full h-full object-cover" alt="preview" />
                             </div>
                        ) : (
                             <div className="w-32 h-20 bg-[#1f1f1f] rounded-[2px] flex items-center justify-center animate-pulse">
                                <span className="text-xs text-[#aaaaaa]">Generating...</span>
                             </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="font-medium text-[15px] text-white">Audience</h4>
                    <p className="text-xs text-[#aaaaaa]">
                        <span className="font-bold">Is this video made for kids?</span> (Required)
                    </p>
                    <div className={`border rounded-[4px] p-4 space-y-3 bg-[#282828] ${audience === null ? 'border-[#505050]' : 'border-[#3ea6ff]'}`}>
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input 
                                type="radio" 
                                name="audience" 
                                className="w-5 h-5 border-2 border-[#aaaaaa] rounded-full"
                                checked={audience === 'kids'}
                                onChange={() => setAudience('kids')}
                            />
                            <span className="text-[15px] text-white block">Yes, it's made for kids</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input 
                                type="radio" 
                                name="audience" 
                                className="w-5 h-5 border-2 border-[#aaaaaa] rounded-full"
                                checked={audience === 'not-kids'}
                                onChange={() => setAudience('not-kids')}
                            />
                            <span className="text-[15px] text-white block">No, it's not made for kids</span>
                        </label>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#ffffff1a]">
                    <button 
                      onClick={() => setShowMore(!showMore)}
                      className="text-[#aaaaaa] font-medium text-xs uppercase hover:text-white bg-[#282828] px-3 py-2 rounded-sm"
                    >
                        {showMore ? 'Show Less' : 'Show More'}
                    </button>
                    {showMore && (
                        <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-top-2">
                             <div className="relative group border border-[#505050] rounded-[4px] px-3 py-2 bg-[#282828] focus-within:border-[#3ea6ff] transition-colors">
                                  <label className="text-xs text-[#aaaaaa] block mb-1">Tags</label>
                                  <input 
                                      value={tags}
                                      onChange={e => setTags(e.target.value)}
                                      className="w-full bg-transparent outline-none text-white text-[15px]"
                                      placeholder="Add tags separated by comma"
                                  />
                              </div>
                        </div>
                    )}
                </div>
              </div>
            )}

            {currentStep === 1 && (
                <div className="space-y-6 max-w-[800px] mx-auto lg:mx-0 animate-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xl font-medium text-white mb-2">Video elements</h3>
                    {[
                        { id: 'subtitles', icon: Subtitles, title: 'Add subtitles', completed: elements.subtitles },
                        { id: 'endScreen', icon: MonitorPlay, title: 'Add an end screen', completed: elements.endScreen },
                        { id: 'cards', icon: Info, title: 'Add cards', completed: elements.cards }
                    ].map((item, i) => (
                        <div key={i} className={`bg-[#1f1f1f] rounded-[4px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${item.completed ? 'border-green-900/50' : 'border-[#ffffff0d]'}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-[#282828] rounded-full">
                                    {item.completed ? <Check size={20} className="text-green-500"/> : <item.icon size={20} className="text-[#aaaaaa]"/>}
                                </div>
                                <div><h4 className="text-[15px] font-medium text-white">{item.title}</h4></div>
                            </div>
                            <button 
                                onClick={() => setActiveElementModal(item.id as any)}
                                className="text-[#3ea6ff] uppercase font-medium text-sm px-2 py-1 hover:bg-[#3ea6ff]/10 rounded-sm"
                            >
                                {item.completed ? 'Edit' : 'Add'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {currentStep === 2 && (
                <div className="space-y-6 max-w-[800px] mx-auto lg:mx-0 animate-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xl font-medium text-white mb-2">Checks</h3>
                    <div className="mb-2 h-1 bg-gray-700 w-full rounded-full overflow-hidden">
                         <div 
                            className={`h-full transition-all duration-700 ${processingProgress === 100 ? 'bg-green-500' : 'bg-[#3ea6ff]'}`} 
                            style={{ width: `${processingProgress}%` }}
                         ></div>
                    </div>
                    <div className="flex justify-between text-xs text-[#aaaaaa]">
                         <span>{processingProgress < 100 ? `${Math.round(processingProgress)}% checked` : "Checks complete"}</span>
                         {processingProgress === 100 && <span className="flex items-center gap-1 text-green-500"><CheckCircle2 size={14}/> No issues found</span>}
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                <div className="space-y-6 max-w-[800px] mx-auto lg:mx-0 animate-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xl font-medium text-white mb-2">Visibility</h3>
                    <div className={`border rounded-[4px] p-4 bg-[#282828] transition-colors border-white`}>
                        <h4 className="text-[15px] text-white font-medium">Save or publish</h4>
                        <div className={`pl-2 space-y-3`}>
                             {[
                                { id: 'private', label: 'Private' },
                                { id: 'unlisted', label: 'Unlisted' },
                                { id: 'public', label: 'Public' }
                             ].map((opt) => (
                                 <label key={opt.id} className="flex items-start gap-3 cursor-pointer p-2">
                                     <input 
                                        type="radio" 
                                        className="w-5 h-5"
                                        checked={visibility === opt.id}
                                        onChange={() => setVisibility(opt.id as any)}
                                     />
                                     <span className="text-white font-medium">{opt.label}</span>
                                 </label>
                             ))}
                        </div>
                    </div>
                </div>
            )}
          </div>

          <div className="hidden lg:flex w-[350px] bg-[#1f1f1f] border-l border-[#ffffff1a] flex-col p-4 gap-4 overflow-y-auto flex-shrink-0">
             <div className="relative aspect-video bg-black rounded-[2px] overflow-hidden">
                {file ? <video src={videoUrl} className="w-full h-full object-cover opacity-80" muted /> : null}
                {generatedThumb && <img src={generatedThumb} className="absolute inset-0 w-full h-full object-cover" alt="preview" />}
             </div>
             <div className="bg-[#282828] border border-[#ffffff1a] rounded-[2px] p-3">
                 <div className="text-xs text-[#aaaaaa] mb-1">Video link</div>
                 <div className="flex items-center justify-between bg-[#1f1f1f] p-2 rounded-[2px]">
                     <span className="text-[#3ea6ff] text-[13px] truncate flex-1">{shortLink}</span>
                     <button onClick={copyToClipboard} className="text-[#aaaaaa] hover:text-white"><Copy size={16}/></button>
                 </div>
             </div>
          </div>
        </div>

        <div className="border-t border-[#ffffff1a] p-3 bg-[#282828] z-30 sticky bottom-0 flex items-center justify-between">
            <div className="hidden md:flex items-center gap-2">
                {uploadProgress < 100 ? (
                    <span className="text-xs text-[#aaaaaa]">Uploading {Math.round(uploadProgress)}% ...</span>
                ) : processingProgress < 100 ? (
                    <span className="text-xs text-[#aaaaaa]">Processing {Math.round(processingProgress)}% ...</span>
                ) : (
                    <span className="text-xs text-green-500">Ready!</span>
                )}
            </div>
            <div className="flex gap-2">
                <button onClick={handleBack} disabled={currentStep === 0} className="text-[#aaaaaa] font-medium uppercase text-sm px-4 py-2 disabled:opacity-0">Back</button>
                <button 
                    onClick={handleNext} 
                    disabled={!isStepValid() || (currentStep === 3 && processingProgress > 0 && processingProgress < 100)}
                    className="bg-[#3ea6ff] text-[#0f0f0f] font-medium uppercase text-sm px-6 py-2 rounded-[2px] shadow-sm"
                >
                    {currentStep === 3 ? (processingProgress > 0 ? 'Publishing...' : 'Publish') : 'Next'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
