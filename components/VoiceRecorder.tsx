
import React, { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, Trash2, Send, Play, Pause, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
    onSend: (audioBlob: Blob) => void;
    onCancel: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isSimulation, setIsSimulation] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Canvas for waveform
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        startRecording();
        return () => {
            stopRecordingLogic();
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const startRecording = async () => {
        setError(null);
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Microphone API not supported");
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            // Setup Visualizer
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            drawWaveform();

            recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            
            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
            };

            recorder.start();
            setIsRecording(true);
            
            timerRef.current = window.setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (e: any) {
            console.warn("Mic access denied/not found, falling back to simulation", e);
            startSimulation();
        }
    };

    const startSimulation = () => {
        setIsSimulation(true);
        setIsRecording(true);
        
        timerRef.current = window.setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);

        // Simulated visualizer
        const drawSimulatedWaveform = () => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            animationRef.current = requestAnimationFrame(drawSimulatedWaveform);

            ctx.fillStyle = '#202c33'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const bars = 30;
            const barWidth = canvas.width / bars;
            for(let i=0; i<bars; i++) {
                // Random height modulation based on time
                const t = Date.now() / 200;
                const h = (Math.sin(t + i) * 0.5 + 0.5) * canvas.height * 0.8;
                
                ctx.fillStyle = `rgb(16, 163, 127)`;
                ctx.fillRect(i * barWidth, (canvas.height - h)/2, barWidth - 1, h);
            }
        };
        drawSimulatedWaveform();
    };

    const stopRecordingLogic = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        } else if (isSimulation && isRecording) {
            // End simulation
            const mockBlob = new Blob([], { type: 'audio/webm' }); // Empty blob for demo
            setAudioBlob(mockBlob);
            setAudioUrl(""); // No real playback available
        }
        
        setIsRecording(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    const drawWaveform = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyserRef.current!.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#202c33';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                ctx.fillStyle = `rgb(16, 163, 127)`; // Omni Green
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };
        draw();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSend = () => {
        if (audioBlob) onSend(audioBlob);
    };

    const togglePlayPreview = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    if (error) {
        return (
            <div className="flex items-center gap-4 w-full bg-wa-incoming p-2 rounded-lg text-red-400 text-sm">
                <AlertCircle size={20} />
                <span>{error}</span>
                <button onClick={onCancel} className="ml-auto p-1 bg-red-900/50 rounded hover:bg-red-900">
                    <Trash2 size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 w-full bg-wa-incoming p-2 rounded-lg animate-in slide-in-from-bottom-2 duration-300">
            <button onClick={onCancel} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition">
                <Trash2 size={20} />
            </button>

            <div className="flex-1 flex flex-col justify-center h-12 relative overflow-hidden bg-gray-900 rounded-md">
                {isRecording ? (
                    <canvas ref={canvasRef} width={300} height={48} className="w-full h-full" />
                ) : (
                    <div className="flex items-center justify-center w-full h-full gap-2">
                        {isSimulation ? (
                             <div className="text-xs text-gray-400 italic">Voice Note Recorded (Simulated)</div>
                        ) : audioUrl && (
                            <>
                                <audio 
                                    ref={audioRef} 
                                    src={audioUrl} 
                                    onEnded={() => setIsPlaying(false)}
                                    className="hidden" 
                                />
                                <button onClick={togglePlayPreview}>
                                    {isPlaying ? <Pause size={20} className="text-wa-accent" /> : <Play size={20} className="text-wa-accent" />}
                                </button>
                                <div className="h-1 bg-gray-600 w-full rounded-full overflow-hidden">
                                    <div className="h-full bg-wa-accent w-1/2"></div>
                                </div>
                            </>
                        )}
                    </div>
                )}
                
                <div className="absolute top-1 left-2 text-xs text-white font-mono bg-black/50 px-1 rounded">
                    {formatTime(duration)}
                </div>
            </div>

            {isRecording ? (
                <button onClick={stopRecordingLogic} className="p-2 text-red-500 animate-pulse">
                    <StopCircle size={24} />
                </button>
            ) : (
                <button onClick={handleSend} className="p-2 bg-wa-accent text-white rounded-full hover:opacity-90">
                    <Send size={20} />
                </button>
            )}
        </div>
    );
};

export default VoiceRecorder;
