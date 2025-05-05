import { useEffect, useRef, useState } from 'react';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { setupWebcam, stopWebcam, captureFaceData } from '@/lib/face-recognition';
import { Camera, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { FacePositionGuide } from './face-position-guide';
import { cn } from '@/lib/utils';

interface FaceCaptureProps {
  onCapture: (faceData: string) => void;
  onCancel: () => void;
}

type CaptureStatus = 'initial' | 'loading' | 'ready' | 'error' | 'capturing';
type FacePosition = 'too-far' | 'too-close' | 'not-centered' | 'good';

export function FaceCapture({ onCapture, onCancel }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<CaptureStatus>('initial');
  const [error, setError] = useState<string>('');
  const [facePosition, setFacePosition] = useState<FacePosition>('not-centered');
  const [isDetecting, setIsDetecting] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  // Request camera access
  const requestCameraPermission = async () => {
    try {
      setStatus('loading');
      setError('');
      
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }
      
      await setupWebcam(videoRef.current);
      setStatus('ready');
      startFaceDetection();
    } catch (err) {
      console.error('Camera access error:', err);
      setStatus('error');
      
      let errorMessage = 'Failed to access camera';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.message.includes('Permission denied')) {
          errorMessage = 'Camera access denied. Please allow camera access in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.message.includes('Requested device not found')) {
          errorMessage = 'No camera found. Please connect a camera and try again.';
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

  // Start face detection
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
          setCaptureProgress(0);
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
        const faceArea = box.width * box.height;
        const frameArea = video.width * video.height;
        const faceRatio = faceArea / frameArea;
        
        // Determine face position
        if (faceRatio < 0.05) {
          setFacePosition('too-far');
        } else if (faceRatio > 0.3) {
          setFacePosition('too-close');
        } else if (distanceFromCenter > video.width * 0.15) {
          setFacePosition('not-centered');
        } else {
          setFacePosition('good');
          
          // If face position is good, increment progress
          if (isCapturing) {
            setCaptureProgress(prev => {
              const newProgress = prev + 2;
              if (newProgress >= 100) {
                // Capture face data when progress reaches 100%
                handleCaptureFace();
              }
              return Math.min(newProgress, 100);
            });
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

  // Initialize camera
  useEffect(() => {
    let mounted = true;

    async function initializeCamera() {
      if (!videoRef.current) return;
      
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
  }, [toast]);

  // Start capture process
  const startCapture = () => {
    setIsCapturing(true);
    setCaptureProgress(0);
  };

  // Handle face capture
  const handleCaptureFace = async () => {
    if (!videoRef.current) return;
    
    try {
      setStatus('capturing');
      const faceData = await captureFaceData(videoRef.current);
      onCapture(faceData);
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
      setIsCapturing(false);
      setCaptureProgress(0);
    }
  };

  // Get message based on face position
  const getFacePositionMessage = () => {
    switch (facePosition) {
      case 'too-far':
        return 'Move closer to the camera';
      case 'too-close':
        return 'Move further from the camera';
      case 'not-centered':
        return 'Center your face in the frame';
      case 'good':
        return isCapturing 
          ? 'Hold still, capturing your face...' 
          : 'Face position is good! Click "Capture" to continue';
      default:
        return 'Position your face in the frame';
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Capture Your Face</CardTitle>
        <CardDescription>
          {status === 'initial' && 'Allow camera access to continue'}
          {status === 'loading' && 'Initializing camera...'}
          {status === 'ready' && getFacePositionMessage()}
          {status === 'error' && 'Camera access error. Please check your settings.'}
          {status === 'capturing' && 'Processing your face data...'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {status === 'initial' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                To register your face, we need access to your camera.
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
          
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button
                onClick={requestCameraPermission}
                variant="secondary"
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
          
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              (status === 'initial' || status === 'error') && "opacity-50"
            )}
            autoPlay
            playsInline
            muted
            width={640}
            height={480}
          />
          
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            width={640}
            height={480}
          />
          
          {/* Face position guide overlay */}
          {status === 'ready' && (
            <FacePositionGuide 
              position={facePosition} 
              progress={captureProgress}
              isCapturing={isCapturing}
            />
          )}
          
          {status === 'capturing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="text-center text-white">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Processing...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isCapturing || status === 'capturing'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button 
          onClick={startCapture}
          disabled={status !== 'ready' || facePosition !== 'good' || isCapturing}
          className="gap-2"
        >
          {isCapturing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Capturing ({captureProgress}%)
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Capture Face
            </>
          )}
        </Button>
      </CardFooter>
    </>
  );
}
