import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from '@shared/schema';
import { setupWebcam, stopWebcam, captureFaceData, saveFaceData, compareFaceWithStored } from '@/lib/face-recognition';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: Omit<User, 'password'>;
  courseId: number;
}

type RecognitionStatus = 'initial' | 'detecting' | 'success' | 'error' | 'registering';

export function FaceRecognitionModal({ 
  isOpen, 
  onClose,
  onSuccess,
  user,
  courseId
}: FaceRecognitionModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<RecognitionStatus>('initial');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      cleanupCamera();
    }
    
    return () => cleanupCamera();
  }, [isOpen]);

  async function startCamera() {
    try {
      if (videoRef.current) {
        await setupWebcam(videoRef.current);
        setStatus('initial');
        
        // If user doesn't have face data yet, prompt to register
        if (!user.faceData) {
          setStatus('registering');
        }
      }
    } catch (error) {
      setErrorMessage('Unable to access camera. Please ensure camera permissions are granted.');
      setStatus('error');
      console.error('Camera setup error:', error);
    }
  }

  async function cleanupCamera() {
    if (videoRef.current) {
      await stopWebcam(videoRef.current);
    }
  }

  async function registerFace() {
    if (!videoRef.current) return;

    try {
      setStatus('detecting');
      const faceData = await captureFaceData(videoRef.current);
      await saveFaceData(faceData);
      
      toast({
        title: "Face registered!",
        description: "Your face has been successfully registered for attendance.",
      });
      
      // Now proceed to mark attendance
      await verifyFace();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to register face');
      setStatus('error');
    }
  }

  async function verifyFace() {
    if (!videoRef.current || !user.faceData) return;
    
    try {
      setStatus('detecting');
      const isMatch = await compareFaceWithStored(videoRef.current, user.faceData);
      
      if (isMatch) {
        setStatus('success');
        
        // Make API call to mark attendance
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            status: 'present'
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to mark attendance');
        }
        
        // Wait a moment to show success before closing
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMessage('Face verification failed. Please try again.');
        setStatus('error');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Face verification failed');
      setStatus('error');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Face Recognition</DialogTitle>
        </DialogHeader>
        
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden mt-2 mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Overlay content based on status */}
          {status !== 'initial' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
              {status === 'detecting' && (
                <>
                  <div className="w-40 h-40 rounded-full border-2 border-teal-500 flex items-center justify-center animate-pulse mb-4">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
                  </div>
                  <p className="text-sm">Analyzing your face...</p>
                </>
              )}
              
              {status === 'success' && (
                <>
                  <div className="w-40 h-40 rounded-full border-2 border-green-500 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                  </div>
                  <p className="text-sm">Attendance marked successfully!</p>
                </>
              )}
              
              {status === 'error' && (
                <>
                  <div className="w-40 h-40 rounded-full border-2 border-red-500 flex items-center justify-center mb-4">
                    <AlertCircle className="h-16 w-16 text-red-500" />
                  </div>
                  <p className="text-sm text-center mx-4">{errorMessage}</p>
                </>
              )}
              
              {status === 'registering' && (
                <>
                  <div className="w-40 h-40 rounded-full border-2 border-blue-500 flex items-center justify-center mb-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                  </div>
                  <p className="text-sm text-center mx-4">We need to register your face first.</p>
                  <p className="text-xs mt-2">Position your face in the center and click "Register Face"</p>
                </>
              )}
            </div>
          )}
        </div>
        
        <Alert>
          <AlertDescription>
            Make sure you are in a well-lit area and looking directly at the camera.
          </AlertDescription>
        </Alert>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          
          {status === 'registering' ? (
            <Button onClick={registerFace}>Register Face</Button>
          ) : (
            status === 'initial' && (
              <Button onClick={verifyFace} disabled={!user.faceData}>
                Verify Face
              </Button>
            )
          )}
          
          {status === 'error' && (
            <Button onClick={status === 'registering' ? registerFace : verifyFace}>
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
