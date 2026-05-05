import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { loadModels, createMatcher } from '@/src/services/ai';
import { dbService } from '@/src/services/db';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const FaceLogin = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [matcher, setMatcher] = useState<faceapi.FaceMatcher | null>(null);
  const [foundUser, setFoundUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await loadModels();
        const faceData = await dbService.getFaceDescriptors();
        if (faceData && faceData.length > 0) {
          const m = createMatcher(faceData);
          setMatcher(m);
        }
        setLoading(false);
        startVideo();
      } catch (err) {
        toast.error("Failed to load recognition engine");
      }
    };
    init();
    return () => stopVideo();
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setActive(true);
      }
    } catch (err) {
      toast.error("Camera access denied");
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setActive(false);
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    let isProcessing = false;

    const processFrame = async () => {
      if (!active || !matcher || !videoRef.current || isProcessing || foundUser) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      isProcessing = true;
      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          const results = detections.map(d => matcher.findBestMatch(d.descriptor));
          const bestMatch = results[0]; // Simple logic for login: take the first one

          if (bestMatch.label !== 'unknown' && bestMatch.distance < 0.4) {
            const userProfile = await dbService.getUser(bestMatch.label);
            if (userProfile) {
              setFoundUser(userProfile);
              toast.success(`Welcome back, ${userProfile.displayName}!`);
              setTimeout(() => {
                navigate(`/student/${userProfile.uid}`);
              }, 1500);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        isProcessing = false;
        animationFrameId = requestAnimationFrame(processFrame);
      }
    };

    if (active && matcher) {
      animationFrameId = requestAnimationFrame(processFrame);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [active, matcher, foundUser, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight">Smart Identity Scan</h1>
          <p className="text-gray-400">Position your face in the center of the frame</p>
        </div>

        <div className="relative aspect-square max-w-sm mx-auto rounded-full overflow-hidden border-4 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
          {loading && (
            <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-20">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-white text-sm">Initializing Neural Networks...</p>
            </div>
          )}
          
          <AnimatePresence>
            {foundUser && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-30 bg-blue-600/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6"
              >
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <UserCheck className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold">{foundUser.displayName}</h2>
                <p className="text-blue-100 mt-2">Identity Verified</p>
                <p className="text-xs text-blue-200 mt-8">Redirecting to information profile...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <video ref={videoRef} autoPlay muted className="w-full h-full object-cover scale-x-[-1]" />
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] z-10"
          />
        </div>

        {!matcher && !loading && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3 text-amber-500 max-w-sm mx-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs text-left">No registered faces found in the database. Please register in the portal first.</p>
          </div>
        )}

        <Button variant="ghost" className="text-gray-500 hover:text-white" onClick={() => navigate('/')}>
          Return to Portal
        </Button>
      </div>
    </div>
  );
};
