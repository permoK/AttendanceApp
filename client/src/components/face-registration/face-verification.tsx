import { useEffect, useRef, useState } from 'react';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { setupWebcam, stopWebcam, compareFaceWithStored } from '@/lib/face-recognition';
import { Camera, AlertCircle, ArrowLeft, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaceVerificationProps {
  faceData: string;
  onVerified: () => void;
  onRetry: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type VerificationStatus = 'initial' | 'loading' | 'ready' | 'verifying' | 'success' | 'error';

export function FaceVerification({ 
  faceData, 
  onVerified, 
  onRetry, 
  onCancel,
  isLoading = false
}: FaceVerificationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<VerificationStatus>('initial');
  const [error, setError] = useState<string>('');
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
      if (videoRef.current) {
        void stopWebcam(videoRef.current);
      }
    };
  }, [toast]);

  // Verify face
  const verifyFace = async () => {
    if (!videoRef.current || !faceData) return;
    
    try {
      setStatus('verifying');
      const isMatch = await compareFaceWithStored(videoRef.current, faceData);
      
      if (isMatch) {
        setStatus('success');
        toast({
          title: 'Verification successful',
          description: 'Your face has been verified successfully.',
        });
      } else {
        setStatus('error');
        setError('Face verification failed. Please try again.');
        toast({
          variant: 'destructive',
          title: 'Verification failed',
          description: 'Face verification failed. Please try again.',
        });
      }
    } catch (err) {
      console.error('Face verification error:', err);
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify face';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Verification Error',
        description: errorMessage
      });
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Verify Your Face</CardTitle>
        <CardDescription>
          {status === 'initial' && 'Allow camera access to verify your face'}
          {status === 'loading' && 'Initializing camera...'}
          {status === 'ready' && 'Look at the camera to verify your face'}
          {status === 'verifying' && 'Verifying your face...'}
          {status === 'success' && 'Face verified successfully!'}
          {status === 'error' && 'Verification failed. Please try again.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {status === 'initial' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                To verify your face, we need access to your camera.
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
          
          {status === 'success' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-black/50">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-lg font-medium text-white mb-2">Verification Successful!</p>
              <p className="text-sm text-white/80">Your face has been verified successfully.</p>
            </div>
          )}
          
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              (status === 'initial' || status === 'error' || status === 'success') && "opacity-50"
            )}
            autoPlay
            playsInline
            muted
            width={640}
            height={480}
          />
          
          {status === 'verifying' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="text-center text-white">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Verifying...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {status === 'success' ? (
          <>
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button onClick={onVerified} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm & Save
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onCancel} disabled={status === 'verifying'}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              onClick={verifyFace}
              disabled={status !== 'ready'}
              className="gap-2"
            >
              {status === 'verifying' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Verify Face
            </Button>
          </>
        )}
      </CardFooter>
    </>
  );
}
