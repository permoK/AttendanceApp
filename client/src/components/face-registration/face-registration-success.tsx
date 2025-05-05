import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';

// Try to import confetti, but handle the case where it might not be available
let confetti: any;
try {
  confetti = require('canvas-confetti').default;
} catch (error) {
  console.warn('canvas-confetti not available:', error);
  confetti = null;
}

interface FaceRegistrationSuccessProps {
  userName: string;
  onComplete: () => void;
}

export function FaceRegistrationSuccess({ userName, onComplete }: FaceRegistrationSuccessProps) {
  // Trigger confetti effect on mount
  useEffect(() => {
    // Skip if confetti is not available
    if (!confetti) return;

    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <CardHeader>
        <CardTitle className="text-center text-2xl">Registration Complete!</CardTitle>
        <CardDescription className="text-center">
          Your face has been successfully registered
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="rounded-full bg-green-100 p-6 mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>

        <h3 className="text-xl font-medium text-center mb-2">
          Congratulations, {userName}!
        </h3>

        <p className="text-center text-muted-foreground mb-6">
          You can now use face recognition to mark your attendance in your courses.
        </p>

        <div className="bg-muted rounded-lg p-4 w-full max-w-sm">
          <h4 className="font-medium mb-2">What's next?</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Your face data is securely stored</li>
            <li>Use face verification to mark attendance</li>
            <li>Update your face data anytime from settings</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={onComplete} className="w-full">
          Continue to Dashboard
        </Button>
      </CardFooter>
    </>
  );
}
