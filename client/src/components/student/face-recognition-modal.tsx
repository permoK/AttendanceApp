import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from '@shared/schema';
import { setupWebcam, stopWebcam, captureFaceData, saveFaceData, compareFaceWithStored } from '@/lib/face-recognition';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Loader2, Camera, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import * as faceapi from 'face-api.js';

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (faceData: string) => void;
  mode: 'register' | 'verify';
}

type RecognitionStatus = 'initial' | 'loading' | 'ready' | 'error' | 'success';
type FacePosition = 'too-far' | 'too-close' | 'not-centered' | 'good';

export function FaceRecognitionModal({ isOpen, onClose, onSuccess, mode }: FaceRecognitionModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<RecognitionStatus>('initial');
  const [error, setError] = useState<string>('');
  const [facePosition, setFacePosition] = useState<FacePosition>('not-centered');
  const [isDetecting, setIsDetecting] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  const requestCameraPermission = async () => {
    try {
      setStatus('loading');
      setError('');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
      }
      
      if (window.isSecureContext === false) {
        throw new Error('Camera access requires a secure connection (HTTPS or localhost).');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (videoRef.current) {
        await setupWebcam(videoRef.current);
        setStatus('ready');
        startFaceDetection();
      } else {
        throw new Error('Video element not found. Please refresh the page and try again.');
      }
    } catch (err) {
      console.error('Camera permission error:', err);
      setStatus('error');
      
      let errorMessage = 'Failed to access camera. ';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera access was denied. Please allow camera access in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found. Please ensure your device has a camera and it is not being used by another application.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Camera is already in use by another application. Please close other apps using the camera and try again.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera does not meet the required constraints. Please try a different camera.';
        } else if (err.name === 'TypeError') {
          errorMessage = 'Camera API error. Please refresh the page and try again.';
        } else {
          errorMessage = err.message || 'An unknown error occurred while accessing the camera.';
        }
      }
      
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Camera Access Error',
        description: errorMessage
      });
    }
  };

  const startFaceDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.width, height: video.height };
    
    faceapi.matchDimensions(canvas, displaySize);
    
    const detectFacePosition = async () => {
      if (!isDetecting) return;
      
      try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();
        
        if (detections.length === 0) {
          setFacePosition('not-centered');
          setScanProgress(0);
          return;
        }
        
        const detection = detections[0];
        const box = detection.detection.box;
        
        // Calculate face position relative to frame
        const centerX = video.width / 2;
        const centerY = video.height / 2;
        const faceCenterX = box.x + box.width / 2;
        const faceCenterY = box.y + box.height / 2;
        
        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(
          Math.pow(faceCenterX - centerX, 2) + 
          Math.pow(faceCenterY - centerY, 2)
        );
        
        // Calculate face size relative to frame
        const faceSize = box.width * box.height;
        const frameSize = video.width * video.height;
        const faceRatio = faceSize / frameSize;
        
        // Determine face position
        if (faceRatio < 0.05) {
          setFacePosition('too-far');
          setScanProgress(Math.max(0, scanProgress - 5));
        } else if (faceRatio > 0.3) {
          setFacePosition('too-close');
          setScanProgress(Math.max(0, scanProgress - 5));
        } else if (distanceFromCenter > 100) {
          setFacePosition('not-centered');
          setScanProgress(Math.max(0, scanProgress - 5));
        } else {
          setFacePosition('good');
          // Increment scan progress when face is in good position
          setScanProgress(Math.min(100, scanProgress + 2));
          
          // If scan is complete, automatically capture
          if (scanProgress >= 100 && !scanning) {
            setScanning(true);
            handleCapture();
          }
        }
        
        // Draw face detection
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        
        requestAnimationFrame(detectFacePosition);
      } catch (error) {
        console.error('Face detection error:', error);
      }
    };
    
    setIsDetecting(true);
    detectFacePosition();
  };

  useEffect(() => {
    let mounted = true;

    async function initializeCamera() {
      if (!isOpen || !videoRef.current) return;
      
      try {
        setStatus('loading');
        setError('');
        await setupWebcam(videoRef.current);
        if (mounted) {
          setStatus('ready');
          startFaceDetection();
        }
      } catch (err) {
        console.error('Camera initialization error:', err);
        if (mounted) {
          setStatus('error');
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize camera';
          setError(errorMessage);
          toast({
            variant: 'destructive',
            title: 'Camera Access Error',
            description: errorMessage
          });
        }
      }
    }

    void initializeCamera();

    return () => {
      mounted = false;
      setIsDetecting(false);
      if (videoRef.current) {
        void stopWebcam(videoRef.current);
      }
    };
  }, [isOpen, toast]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    
    try {
      setStatus('loading');
      const faceData = await captureFaceData(videoRef.current);
      setStatus('success');
      onSuccess(faceData);
    } catch (err) {
      console.error('Face capture error:', err);
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture face';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Face Detection Error',
        description: errorMessage
      });
    }
  };

  const getFacePositionMessage = () => {
    switch (facePosition) {
      case 'too-far':
        return 'Please move closer to the camera';
      case 'too-close':
        return 'Please move further from the camera';
      case 'not-centered':
        return 'Please center your face in the frame';
      case 'good':
        return 'Perfect! Your face is well positioned';
      default:
        return 'Position your face in the center of the frame';
    }
  };

  const getFacePositionIcon = () => {
    switch (facePosition) {
      case 'too-far':
        return <ArrowDown className="h-6 w-6 text-yellow-500 animate-bounce" />;
      case 'too-close':
        return <ArrowUp className="h-6 w-6 text-yellow-500 animate-bounce" />;
      case 'not-centered':
        return <ArrowLeft className="h-6 w-6 text-yellow-500 animate-pulse" />;
      case 'good':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'register' ? 'Register Your Face' : 'Verify Your Face'}
          </DialogTitle>
          <DialogDescription>
            {status === 'initial' && 'Click the button below to allow camera access.'}
            {status === 'loading' && 'Initializing camera...'}
            {status === 'ready' && getFacePositionMessage()}
            {status === 'error' && 'Camera access error. Please check your settings.'}
            {status === 'success' && 'Face captured successfully!'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {status === 'initial' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                To use face recognition, we need access to your camera.
                Click the button below to allow camera access in your browser.
              </p>
              <Button
                onClick={requestCameraPermission}
                className="gap-2 relative z-20"
              >
                <Camera className="h-4 w-4" />
                Allow Camera Access
              </Button>
            </div>
          )}
          
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "h-full w-full object-cover",
                status === 'initial' && "hidden"
              )}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />
            
            {/* Face position guide overlay */}
            {status === 'ready' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Scanning animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {/* Outer circle */}
                    <div className="absolute inset-0 border-2 border-white/30 rounded-full" />
                    
                    {/* Scanning line */}
                    <div 
                      className="absolute inset-0 border-2 border-blue-500 rounded-full"
                      style={{
                        clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0)`,
                        transform: `rotate(${scanProgress * 3.6}deg)`,
                        transformOrigin: 'center',
                        transition: 'transform 0.1s linear'
                      }}
                    />
                    
                    {/* Progress indicator */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-sm font-medium">
                        {scanProgress < 100 ? `${scanProgress}%` : 'Ready!'}
                      </div>
                    </div>
                    
                    {/* Face position indicator */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                      {getFacePositionIcon()}
                    </div>
                  </div>
                </div>
                
                {/* Directional guides */}
                {facePosition !== 'good' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full flex items-center justify-center">
                      {facePosition === 'too-far' && (
                        <div className="flex flex-col items-center">
                          <ArrowDown className="h-8 w-8 text-yellow-500 animate-bounce" />
                          <span className="text-white text-sm mt-2">Move closer</span>
                        </div>
                      )}
                      {facePosition === 'too-close' && (
                        <div className="flex flex-col items-center">
                          <ArrowUp className="h-8 w-8 text-yellow-500 animate-bounce" />
                          <span className="text-white text-sm mt-2">Move back</span>
                        </div>
                      )}
                      {facePosition === 'not-centered' && (
                        <div className="flex items-center gap-4">
                          <ArrowLeft className="h-8 w-8 text-yellow-500 animate-pulse" />
                          <span className="text-white text-sm">Center your face</span>
                          <ArrowRight className="h-8 w-8 text-yellow-500 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          
          {status === 'error' && (
            <Alert variant="destructive" className="mt-4 z-10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {error.includes('denied') && (
                  <div className="mt-2">
                    To fix this:
                    <ol className="ml-4 list-decimal">
                      <li>Click the camera icon in your browser's address bar</li>
                      <li>Select "Allow" for camera access</li>
                      <li>Click the "Allow Camera Access" button below</li>
                    </ol>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {status === 'error' && (
            <Button
              onClick={requestCameraPermission}
              variant="secondary"
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Allow Camera Access
            </Button>
          )}
          <Button
            onClick={handleCapture}
            disabled={status !== 'ready' || scanning}
            className="gap-2"
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {mode === 'register' ? 'Register Face' : 'Verify Face'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
