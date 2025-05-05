import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FaceCapture } from './face-capture';
import { FaceVerification } from './face-verification';
import { FaceRegistrationSuccess } from './face-registration-success';
import { useToast } from '@/hooks/use-toast';
import { saveFaceData } from '@/lib/face-recognition';
import { Loader2, ArrowLeft, ArrowRight, Camera, CheckCircle2 } from 'lucide-react';

type Step = 'intro' | 'capture' | 'verify' | 'success';

interface FaceRegistrationWizardProps {
  onComplete: (faceData: string) => void;
  onCancel: () => void;
  userId?: number;
  userName?: string;
}

export function FaceRegistrationWizard({ 
  onComplete, 
  onCancel,
  userId,
  userName
}: FaceRegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [faceData, setFaceData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCapture = async (capturedFaceData: string) => {
    setFaceData(capturedFaceData);
    setCurrentStep('verify');
  };

  const handleVerificationSuccess = async () => {
    if (!faceData) return;
    
    setIsLoading(true);
    try {
      await saveFaceData(faceData);
      setCurrentStep('success');
      onComplete(faceData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Failed to save face data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setFaceData(null);
    setCurrentStep('capture');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Face Registration</CardTitle>
              <CardDescription>
                Register your face for secure attendance tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-6 text-center">
                <Camera className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Why register your face?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Face recognition provides a secure and convenient way to mark your attendance.
                  Your face data is securely stored and only used for attendance verification.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">The process is simple:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Position your face in the camera frame</li>
                  <li>Follow the on-screen guidance</li>
                  <li>Verify your face data</li>
                  <li>Complete the registration</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={() => setCurrentStep('capture')}>
                Start Registration
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );
      
      case 'capture':
        return <FaceCapture onCapture={handleCapture} onCancel={onCancel} />;
      
      case 'verify':
        return (
          <FaceVerification 
            faceData={faceData || ''} 
            onVerified={handleVerificationSuccess}
            onRetry={handleRetry}
            onCancel={onCancel}
            isLoading={isLoading}
          />
        );
      
      case 'success':
        return (
          <FaceRegistrationSuccess 
            userName={userName || 'User'} 
            onComplete={() => onComplete(faceData || '')}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      {renderStep()}
    </Card>
  );
}
