import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from '@shared/schema';
import { setupWebcam, stopWebcam, captureFaceData, saveFaceData, compareFaceWithStored } from '@/lib/face-recognition';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Loader2, Camera } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (faceData: string) => void;
  mode: 'register' | 'verify';
}

type RecognitionStatus = 'initial' | 'loading' | 'ready' | 'error' | 'success';

export function FaceRecognitionModal({ isOpen, onClose, onSuccess, mode }: FaceRecognitionModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<RecognitionStatus>('initial');
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const requestCameraPermission = async () => {
    try {
      setStatus('loading');
      setError('');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
      }
      
      // Check if we're in a secure context (HTTPS or localhost)
      if (window.isSecureContext === false) {
        throw new Error('Camera access requires a secure connection (HTTPS or localhost).');
      }
      
      // Explicitly request camera permission from the browser
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Stop the stream immediately as we just wanted to trigger the permission
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (videoRef.current) {
        await setupWebcam(videoRef.current);
        setStatus('ready');
      } else {
        throw new Error('Video element not found. Please refresh the page and try again.');
      }
    } catch (err) {
      console.error('Camera permission error:', err);
      setStatus('error');
      
      let errorMessage = 'Failed to access camera. ';
      
      if (err instanceof Error) {
        // Handle specific error cases
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

  useEffect(() => {
    let mounted = true;

    async function initializeCamera() {
      if (!isOpen || !videoRef.current) return;
      
      try {
        setStatus('loading');
        setError('');
        await setupWebcam(videoRef.current);
        if (mounted) setStatus('ready');
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
            {status === 'ready' && 'Position your face in the center of the frame.'}
            {status === 'error' && 'Camera access error. Please check your settings.'}
            {status === 'success' && 'Face captured successfully!'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {status === 'initial' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                To use face recognition, we need access to your camera.
                Click the button below to allow camera access in your browser.
              </p>
              <Button
                onClick={requestCameraPermission}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                Allow Camera Access
              </Button>
            </div>
          )}
          
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
          
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          
          {status === 'error' && (
            <Alert variant="destructive" className="mt-4">
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
            disabled={status !== 'ready'}
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
