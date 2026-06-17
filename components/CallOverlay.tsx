
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { callService } from '../services/callService';
import { supabase } from '../services/supabase';
import { Call } from '../types';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, AlertTriangle } from 'lucide-react';

const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

const CallOverlay = () => {
    const { user } = useAuth();
    const [incomingCall, setIncomingCall] = useState<Call | null>(null);
    const [activeCall, setActiveCall] = useState<Call | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callStatus, setCallStatus] = useState<string>('');
    
    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const channelRef = useRef<any>(null);

    // Subscribe to calls (Incoming and Outgoing/Active)
    useEffect(() => {
        if (!user) return;

        // Incoming calls
        const incomingSub = callService.subscribeToIncomingCalls(user.id, (call) => {
            console.log("Incoming call:", call);
            setIncomingCall(call);
        });

        // Outgoing calls (if I started it elsewhere)
        const outgoingSub = callService.subscribeToOutgoingCalls(user.id, (call) => {
            console.log("Outgoing/Active call detected:", call);
            if (call.status === 'ringing') {
                setActiveCall(call);
                setCallStatus('Calling...');
                initializeMedia(call.type).then((stream) => {
                     if (stream) startSignaling(call, true, stream);
                });
            }
        });

        return () => { 
            supabase.removeChannel(incomingSub);
            supabase.removeChannel(outgoingSub);
        };
    }, [user]);

    const initializeMedia = async (type: 'voice' | 'video') => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Device API unavailable");
            }
            
            const currentStream = await navigator.mediaDevices.getUserMedia({ 
                video: type === 'video', 
                audio: true 
            });
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;
            return currentStream;
        } catch (err) {
            console.error("Failed to get media, falling back to simulation.", err);
            
            // Mock Media Stream
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 240;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const draw = () => {
                        if (!ctx) return;
                        ctx.fillStyle = '#222';
                        ctx.fillRect(0,0,320,240);
                        
                        const t = Date.now() / 1000;
                        const x = 160 + Math.sin(t) * 50;
                        
                        ctx.fillStyle = '#10a37f';
                        ctx.beginPath();
                        ctx.arc(x, 120, 20, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = '#fff';
                        ctx.font = '16px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(type === 'video' ? "Video Sim" : "Voice Sim", 160, 200);
                        
                        requestAnimationFrame(draw);
                    };
                    draw();
                }
                const mockStream = canvas.captureStream(30);
                
                // Audio
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const dest = audioCtx.createMediaStreamDestination();
                const gain = audioCtx.createGain();
                gain.gain.value = 0; // Silent
                gain.connect(dest);
                mockStream.addTrack(dest.stream.getAudioTracks()[0]);
                
                setStream(mockStream);
                if (myVideo.current && type === 'video') myVideo.current.srcObject = mockStream;
                
                return mockStream;
            } catch (mockErr) {
                setCallStatus('Failed to access Camera/Mic');
                return null;
            }
        }
    };

    const startSignaling = (call: Call, isInitiator: boolean, localStream: MediaStream) => {
        const channel = callService.getSignalChannel(call.session_id);
        channelRef.current = channel;

        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerRef.current = pc;

        // Add local tracks
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        // Handle remote stream
        pc.ontrack = (event) => {
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.send({ type: 'broadcast', event: 'candidate', payload: event.candidate });
            }
        };

        // Channel listeners
        channel.on('broadcast', { event: 'offer' }, async (payload: any) => {
            if (isInitiator) return; // Ignore own offer if any weird reflection
            await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({ type: 'broadcast', event: 'answer', payload: answer });
        });

        channel.on('broadcast', { event: 'answer' }, async (payload: any) => {
            if (!isInitiator) return;
            await pc.setRemoteDescription(new RTCSessionDescription(payload.payload));
            setCallStatus('Connected');
        });

        channel.on('broadcast', { event: 'candidate' }, async (payload: any) => {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(payload.payload));
            } catch (e) {
                console.error("Error adding ice candidate", e);
            }
        });

        channel.subscribe(async (status: string) => {
             if (status === 'SUBSCRIBED' && isInitiator) {
                 // Create Offer
                 const offer = await pc.createOffer();
                 await pc.setLocalDescription(offer);
                 channel.send({ type: 'broadcast', event: 'offer', payload: offer });
             }
        });
    };

    const answerCall = async () => {
        if (!incomingCall) return;
        setIncomingCall(null);
        setActiveCall(incomingCall);
        setCallStatus('Connecting...');
        
        const currentStream = await initializeMedia(incomingCall.type);
        if (!currentStream) {
            setTimeout(() => endCall(), 2000); // Close after showing error
            return;
        }

        await callService.answerCall(incomingCall.id);
        startSignaling(incomingCall, false, currentStream);
    };

    const endCall = () => {
        const callId = activeCall?.id || incomingCall?.id;
        if (callId) callService.endCall(callId);
        
        cleanup();
    };

    const cleanup = () => {
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIncomingCall(null);
        setActiveCall(null);
        setCallStatus('');
    };

    // Toggle Mute/Video
    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };
    
    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    if (incomingCall) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
                <div className="bg-gray-900 p-8 rounded-2xl flex flex-col items-center gap-6 animate-bounce-subtle border border-gray-700 shadow-2xl">
                    <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                        {incomingCall.type === 'video' ? <Video size={40} className="text-white" /> : <Phone size={40} className="text-white" />}
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white">Incoming {incomingCall.type} Call...</h2>
                        <p className="text-gray-400">Someone is calling you</p>
                    </div>
                    <div className="flex gap-8">
                        <button onClick={endCall} className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition shadow-lg"><PhoneOff size={32} className="text-white"/></button>
                        <button onClick={answerCall} className="p-4 bg-green-500 rounded-full hover:bg-green-600 transition animate-bounce shadow-lg"><Phone size={32} className="text-white"/></button>
                    </div>
                </div>
            </div>
        );
    }

    if (activeCall) {
        return (
            <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
                <div className="flex-1 relative bg-black">
                    {/* Video Elements */}
                    {activeCall.type === 'video' && !callStatus.includes('Failed') && (
                        <>
                            <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
                            <div className="absolute top-4 right-4 w-32 h-48 bg-black rounded-lg overflow-hidden border-2 border-white/20 shadow-lg z-10">
                                <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
                            </div>
                        </>
                    )}

                    {/* Audio/Status Only UI */}
                    {((activeCall.type === 'voice' || callStatus === 'Calling...' || callStatus.includes('Failed')) && activeCall.type !== 'video') || (activeCall.type === 'video' && callStatus.includes('Failed')) ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                             <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center relative">
                                 <div className="w-28 h-28 bg-gray-600 rounded-full flex items-center justify-center animate-pulse">
                                     <span className="text-4xl font-bold text-white">User</span>
                                 </div>
                             </div>
                             <div className="text-center">
                                <h2 className="text-2xl font-bold text-white">{callStatus || 'Connected'}</h2>
                                {callStatus.includes('Failed') && <AlertTriangle className="mx-auto mt-2 text-yellow-500"/>}
                                <span className="text-green-400 font-mono block mt-2">00:00</span>
                             </div>
                        </div>
                    ) : null}
                </div>
                
                {/* Controls */}
                <div className="h-24 bg-black/60 backdrop-blur-md flex items-center justify-center gap-6 absolute bottom-0 w-full pb-4">
                     <button onClick={toggleMute} className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}>
                         {isMuted ? <MicOff /> : <Mic />}
                     </button>
                     <button onClick={endCall} className="p-4 bg-red-600 rounded-full hover:bg-red-700 w-20 flex items-center justify-center shadow-lg transform hover:scale-105 transition-all">
                         <PhoneOff size={32} className="text-white" />
                     </button>
                     {activeCall.type === 'video' && (
                        <button onClick={toggleVideo} className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}>
                            {isVideoOff ? <VideoOff /> : <Video />}
                        </button>
                     )}
                </div>
            </div>
        );
    }

    return null;
};

export default CallOverlay;
