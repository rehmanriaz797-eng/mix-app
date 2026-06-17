
import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Video, Smile, Film, X, Camera, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { moderateContent } from '../services/geminiService';
import StoriesRail from '../components/StoriesRail';
import { Post } from '../types';

const SocialFeed = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'reels'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  
  // Post Creation State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState<string>(''); // For loading UI
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch Real Posts
  useEffect(() => {
    const fetchPosts = async () => {
        const { data, error } = await supabase
            .from('posts')
            .select('*, profiles(username, avatar_url, full_name)')
            .order('created_at', { ascending: false });
        
        if (data) setPosts(data as any);
    };
    fetchPosts();

    const channel = supabase.channel('realtime-posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
            (payload) => { fetchPosts(); }
        )
        .subscribe();
        
    return () => { supabase.removeChannel(channel) };
  }, []);

  // Handle Live Camera with Error Handling & Fallback
  useEffect(() => {
      let stream: MediaStream | null = null;
      let animationId: number;
      
      const startCamera = async () => {
          if (!showLiveModal) return;
          setCameraError(null);

          try {
              if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                  stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
              } else {
                  throw new Error("MediaDevices API not found");
              }

              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
              }
          } catch (err: any) {
              console.warn("Camera access denied or unavailable. Switching to Simulation Mode.", err);
              
              // Fallback: Create a Mock Stream using Canvas
              const canvas = document.createElement('canvas');
              canvas.width = 640;
              canvas.height = 360;
              const ctx = canvas.getContext('2d');

              if (ctx) {
                  const drawSimulation = () => {
                      if (!showLiveModal) return;
                      animationId = requestAnimationFrame(drawSimulation);

                      // Background
                      ctx.fillStyle = '#111';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);

                      // Animated Element
                      const t = Date.now() / 1000;
                      const x = canvas.width / 2 + Math.sin(t) * 100;
                      const y = canvas.height / 2 + Math.cos(t * 1.5) * 50;

                      ctx.fillStyle = '#ef4444'; // Red dot
                      ctx.beginPath();
                      ctx.arc(x, y, 20, 0, Math.PI * 2);
                      ctx.fill();

                      // Text
                      ctx.fillStyle = '#fff';
                      ctx.font = '24px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.fillText("Camera Simulation", canvas.width / 2, canvas.height / 2 + 80);
                      ctx.font = '14px sans-serif';
                      ctx.fillStyle = '#888';
                      ctx.fillText("(Hardware access unavailable)", canvas.width / 2, canvas.height / 2 + 110);
                  };
                  drawSimulation();

                  try {
                      const mockStream = canvas.captureStream(30);
                      
                      // Mock Audio Track
                      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const dest = audioCtx.createMediaStreamDestination();
                      const osc = audioCtx.createOscillator();
                      const gain = audioCtx.createGain();
                      gain.gain.value = 0; // Silent
                      osc.connect(gain);
                      gain.connect(dest);
                      osc.start();
                      mockStream.addTrack(dest.stream.getAudioTracks()[0]);

                      stream = mockStream;
                      if (videoRef.current) {
                          videoRef.current.srcObject = stream;
                      }
                      // Explicitly clear error to show the simulation instead of error message
                      setCameraError(null);
                  } catch (e) {
                      setCameraError("Unable to initialize camera simulation.");
                  }
              } else {
                  setCameraError("Failed to access camera.");
              }
          }
      };

      if (showLiveModal) {
          startCamera();
      }

      return () => {
          if (stream) {
              stream.getTracks().forEach(t => t.stop());
          }
          cancelAnimationFrame(animationId);
      };
  }, [showLiveModal]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const clearFile = () => {
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePost = async () => {
      if ((!content.trim() && !selectedFile) || !profile) return;
      setIsPosting(true);
      setPostStatus('Analyzing content...');

      try {
          // 1. Moderate Content with AI
          if (content.trim()) {
              const moderation = await moderateContent(content);
              if (!moderation.isSafe) {
                  alert(`⚠️ Post blocked by AI Safety Check.\nReason: ${moderation.reason || 'Harmful content detected'}`);
                  setIsPosting(false);
                  setPostStatus('');
                  return;
              }
          }

          setPostStatus('Uploading...');

          let mediaUrl = null;
          let mediaType: 'image' | 'video' | null = null;

          if (selectedFile) {
              const fileExt = selectedFile.name.split('.').pop();
              const fileName = `posts/${profile.id}/${Date.now()}.${fileExt}`;
              const { error: uploadError } = await supabase.storage.from('media').upload(fileName, selectedFile);
              if (uploadError) throw uploadError;
              
              const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
              mediaUrl = publicUrl;
              mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image';
          }

          const { error } = await supabase.from('posts').insert({
              user_id: profile.id,
              content: content,
              media_url: mediaUrl,
              media_type: mediaType || 'image'
          });

          if (error) throw error;
          
          // Reset
          setContent('');
          clearFile();
      } catch (e) {
          console.error("Post failed", e);
          alert("Failed to post. Try again.");
      } finally {
          setIsPosting(false);
          setPostStatus('');
      }
  };

  return (
    <div className="flex min-h-screen bg-fb-bg text-gray-200 justify-center">
        {/* Left Sidebar */}
        <div className="hidden xl:flex flex-col w-[300px] p-4 fixed left-[72px] top-0 h-screen overflow-y-auto">
            <div className="flex items-center gap-3 p-3 hover:bg-fb-card rounded-lg cursor-pointer transition-colors">
                <img src={profile?.avatar_url || 'https://picsum.photos/seed/me/100'} className="w-9 h-9 rounded-full" />
                <span className="font-medium">{profile?.full_name || 'My Profile'}</span>
            </div>
            <div 
                onClick={() => setActiveTab('feed')}
                className={`flex items-center gap-3 p-3 hover:bg-fb-card rounded-lg cursor-pointer transition-colors ${activeTab === 'feed' ? 'bg-fb-card' : ''}`}
            >
                <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center"><ImageIcon size={20}/></div>
                <span className="font-medium">Feed</span>
            </div>
            <div 
                onClick={() => setActiveTab('reels')}
                className={`flex items-center gap-3 p-3 hover:bg-fb-card rounded-lg cursor-pointer transition-colors ${activeTab === 'reels' ? 'bg-fb-card' : ''}`}
            >
                <div className="w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center"><Film size={20}/></div>
                <span className="font-medium">Reels</span>
            </div>
        </div>

        {/* Main Feed Content */}
        <div className="w-full max-w-[600px] py-6 px-4 space-y-6">
            
            {activeTab === 'feed' && (
                <>
                    {/* Stories */}
                    <StoriesRail />

                    {/* Create Post */}
                    <div className="bg-fb-card rounded-lg p-4">
                        <div className="flex gap-3 mb-3 border-b border-gray-700 pb-3">
                            <img src={profile?.avatar_url || 'https://picsum.photos/seed/me/100'} className="w-10 h-10 rounded-full" />
                            <div className="flex-1 rounded-full flex flex-col gap-2">
                                <div className="bg-gray-700/50 rounded-full px-4 flex items-center">
                                    <input 
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder={`What's on your mind, ${profile?.username || 'User'}?`} 
                                        className="bg-transparent border-none outline-none w-full text-sm placeholder-gray-400 py-2.5" 
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePost()}
                                    />
                                    {content && (
                                        <div title="AI Moderation Active">
                                            <ShieldCheck size={16} className="text-green-500 ml-2" />
                                        </div>
                                    )}
                                </div>
                                {previewUrl && (
                                    <div className="relative mt-2 w-full rounded-lg overflow-hidden max-h-60 bg-black">
                                        <button onClick={clearFile} className="absolute top-2 right-2 bg-black/60 p-1 rounded-full hover:bg-black"><X size={16} /></button>
                                        {selectedFile?.type.startsWith('video') ? (
                                            <video src={previewUrl} className="w-full h-full object-contain" controls />
                                        ) : (
                                            <img src={previewUrl} className="w-full h-full object-contain" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between px-4">
                            <button 
                                onClick={() => setShowLiveModal(true)}
                                className="flex items-center gap-2 text-gray-400 hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors"
                            >
                                <Video size={24} className="text-red-500" /> <span className="text-sm font-medium">Live Video</span>
                            </button>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 text-gray-400 hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors"
                            >
                                <ImageIcon size={24} className="text-green-500" /> <span className="text-sm font-medium">Photo/Video</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-400 hover:bg-gray-700 p-2 rounded-lg cursor-pointer transition-colors">
                                <Smile size={24} className="text-yellow-500" /> <span className="text-sm font-medium">Activity</span>
                            </button>
                        </div>
                        
                        {(content || selectedFile) && (
                            <div className="mt-2 flex justify-end items-center gap-3">
                                {isPosting && <span className="text-xs text-gray-400 animate-pulse">{postStatus}</span>}
                                <button 
                                    onClick={handlePost}
                                    disabled={isPosting}
                                    className="bg-blue-600 text-white px-6 py-1.5 rounded-lg font-medium text-sm hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {isPosting ? 'Processing...' : 'Post'}
                                </button>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" />
                    </div>

                    {/* Posts */}
                    {posts.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No posts yet. Be the first!</div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="bg-fb-card rounded-lg overflow-hidden shadow-sm">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={post.profiles?.avatar_url || 'https://picsum.photos/seed/u/100'} className="w-10 h-10 rounded-full bg-gray-700" />
                                        <div>
                                            <h4 className="font-bold text-sm text-white">{post.profiles?.full_name || 'User'}</h4>
                                            <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()} • 🌍</span>
                                        </div>
                                    </div>
                                    <MoreHorizontal className="text-gray-400 cursor-pointer" />
                                </div>
                                <div className="px-4 pb-3">
                                    <p className="text-sm text-white whitespace-pre-wrap">{post.content}</p>
                                </div>
                                {post.media_url && (
                                    <div className="w-full bg-black">
                                        {post.media_type === 'video' ? (
                                            <video src={post.media_url} controls className="w-full max-h-[600px] object-contain" />
                                        ) : (
                                            <img src={post.media_url} className="w-full h-auto object-cover max-h-[600px]" />
                                        )}
                                    </div>
                                )}
                                <div className="px-4 py-2 flex items-center justify-between text-gray-400 text-sm border-b border-gray-700 mx-4">
                                    <div className="flex items-center gap-1">👍 ❤️ <span>{post.likes_count || 0}</span></div>
                                    <div className="flex gap-3">
                                        <span>{post.comments_count || 0} comments</span>
                                    </div>
                                </div>
                                <div className="p-1 px-2 flex justify-between">
                                    <button className="flex-1 flex items-center justify-center gap-2 hover:bg-gray-700 py-2 rounded-lg transition-colors text-gray-400 font-medium">
                                        <Heart size={20} /> Like
                                    </button>
                                    <button className="flex-1 flex items-center justify-center gap-2 hover:bg-gray-700 py-2 rounded-lg transition-colors text-gray-400 font-medium">
                                        <MessageCircle size={20} /> Comment
                                    </button>
                                    <button className="flex-1 flex items-center justify-center gap-2 hover:bg-gray-700 py-2 rounded-lg transition-colors text-gray-400 font-medium">
                                        <Share2 size={20} /> Share
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {activeTab === 'reels' && (
                <div className="flex flex-col gap-6 items-center">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-[360px] h-[640px] bg-gray-900 rounded-xl overflow-hidden relative shadow-lg border border-gray-800">
                             <div className="absolute inset-0 bg-black flex items-center justify-center text-gray-500">
                                 {/* In real app, load from 'reels' table */}
                                 <Film size={48} className="opacity-20" />
                             </div>
                             <div className="absolute bottom-4 left-4 right-4 text-white">
                                 <h3 className="font-bold flex items-center gap-2">
                                     <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
                                     User {i}
                                 </h3>
                                 <p className="text-sm mt-2">Reel content coming soon! #viral</p>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Live Video Modal */}
        {showLiveModal && (
            <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            LIVE PREVIEW
                        </div>
                        <button onClick={() => setShowLiveModal(false)}><X className="text-gray-400 hover:text-white"/></button>
                    </div>
                    
                    <div className="aspect-video bg-black relative flex items-center justify-center">
                        {cameraError ? (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                <AlertCircle size={48} className="text-red-500" />
                                <p>{cameraError}</p>
                            </div>
                        ) : (
                            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
                        )}
                        
                        {!cameraError && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                                <button className="w-16 h-16 bg-red-600 rounded-full border-4 border-white flex items-center justify-center hover:scale-110 transition-transform">
                                    <div className="w-6 h-6 bg-white rounded-sm"></div>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-gray-800 text-center text-sm text-gray-400">
                        {cameraError ? "Please check your camera settings." : "Camera access is used only for this preview."}
                    </div>
                </div>
            </div>
        )}

        {/* Right Sidebar */}
        <div className="hidden xl:block w-[300px] p-4 fixed right-0 top-0 h-screen overflow-y-auto">
            <h3 className="text-gray-400 font-bold mb-4">Contacts</h3>
            {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-3 p-2 hover:bg-fb-card rounded-lg cursor-pointer transition-colors">
                    <div className="relative">
                        <img src={`https://picsum.photos/seed/c${i}/100`} className="w-9 h-9 rounded-full" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-fb-bg"></div>
                    </div>
                    <span className="font-medium text-sm">Contact {i}</span>
                </div>
            ))}
        </div>
    </div>
  );
};

export default SocialFeed;
