import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FaceRegistrationWizard } from '@/components/face-registration/face-registration-wizard';
import { FaceCapture } from '@/components/face-registration/face-capture';
import { FaceVerification } from '@/components/face-registration/face-verification';
import { useAuth } from '@/hooks/use-auth';

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (faceData: string) => void;
  mode: 'register' | 'verify';
}

export function FaceRecognitionModal({ isOpen, onClose, onSuccess, mode }: FaceRecognitionModalProps) {
  const { user } = useAuth();
  const [faceData, setFaceData] = useState<string | null>(null);

  // Handle face capture for verification mode
  const handleCapture = (capturedFaceData: string) => {
    if (mode === 'verify') {
      // For verification mode, directly pass the captured face data to the success handler
      onSuccess(capturedFaceData);
    } else {
      // For registration mode, store the face data for verification
      setFaceData(capturedFaceData);
    }
  };

  // Handle verification success
  const handleVerificationSuccess = () => {
    if (faceData) {
      onSuccess(faceData);
    }
  };

  // Render the appropriate component based on mode
  const renderContent = () => {
    if (mode === 'register') {
      return (
        <FaceRegistrationWizard
          onComplete={onSuccess}
          onCancel={onClose}
          userId={user?.id}
          userName={user?.name}
        />
      );
    } else {
      // For verification mode, we only need the face capture component
      return faceData ? (
        <FaceVerification
          faceData={faceData}
          onVerified={handleVerificationSuccess}
          onRetry={() => setFaceData(null)}
          onCancel={onClose}
        />
      ) : (
        <FaceCapture
          onCapture={handleCapture}
          onCancel={onClose}
        />
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
