import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { loadModels, createMatcher } from '../services/ai';
import { dbService } from '../services/db';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, CheckCircle2, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface FaceRecognitionProps {
  courseId: string;
  onDetected: (userId: string) => void;
}

export const FaceRecognition: React.FC<FaceRecognitionProps> = ({ courseId, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [matcher, setMatcher] = useState<faceapi.FaceMatcher | null>(null);
  const [detectedUsers, setDetectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const init = async () => {
      try {
        await loadModels();
        const faceData = await dbService.getFaceDescriptors();
        if (faceData) {
          const m = createMatcher(faceData);
          setMatcher(m);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load AI models");
      }
    };
    init();
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
      if (!active || !matcher || !videoRef.current || isProcessing) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      isProcessing = true;
      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (canvasRef.current && videoRef.current) {
          const displaySize = { 
            width: videoRef.current.videoWidth, 
            height: videoRef.current.videoHeight 
          };
          faceapi.matchDimensions(canvasRef.current, displaySize);
          
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          const results = resizedDetections.map(d => matcher.findBestMatch(d.descriptor));

          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, displaySize.width, displaySize.height);

          results.forEach((match, i) => {
            if (match.label !== 'unknown' && match.distance < 0.45) {
              setDetectedUsers(prev => {
                if (prev.has(match.label)) return prev;
                const next = new Set(prev);
                next.add(match.label);
                onDetected(match.label);
                return next;
              });
            }
            
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { 
              label: match.toString(),
              boxColor: match.label === 'unknown' ? '#ef4444' : '#22c55e' 
            });
            drawBox.draw(canvasRef.current!);
          });
        }
      } catch (err) {
        console.error("Frame processing error:", err);
      } finally {
        isProcessing = false;
        animationFrameId = requestAnimationFrame(processFrame);
      }
    };

    if (active && matcher) {
      animationFrameId = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [active, matcher, onDetected]);

  if (loading) return <div className="flex flex-col items-center justify-center p-12 gap-4">
    <RefreshCw className="animate-spin text-blue-600 w-10 h-10" />
    <p className="text-gray-500 font-medium font-sans">Initializing AI Models...</p>
  </div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 border-4 border-gray-100 shadow-2xl aspect-video">
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm z-10">
            <Button onClick={startVideo} size="lg" className="gap-2 bg-white text-black hover:bg-gray-100">
              <Camera className="w-5 h-5" />
              Start Attendance Camera
            </Button>
            <p className="text-white/70 text-sm mt-4 font-sans">Camera will scan faces automatically</p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-full">
            <UserCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 font-sans">{detectedUsers.size} Found</h4>
            <p className="text-xs text-gray-500 font-sans font-medium uppercase tracking-wider">Present in session</p>
          </div>
        </div>
        <Button variant="outline" onClick={stopVideo} disabled={!active}>Stop Camera</Button>
      </div>
    </div>
  );
};
