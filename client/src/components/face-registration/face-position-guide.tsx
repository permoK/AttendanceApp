import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface FacePositionGuideProps {
  position: 'too-far' | 'too-close' | 'not-centered' | 'good';
  progress: number;
  isCapturing: boolean;
}

export function FacePositionGuide({ position, progress, isCapturing }: FacePositionGuideProps) {
  // Determine which guide to show based on position
  const renderPositionGuide = () => {
    switch (position) {
      case 'too-far':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 text-white rounded-full p-3 animate-pulse">
              <ArrowDown className="h-8 w-8" />
            </div>
          </div>
        );
      
      case 'too-close':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 text-white rounded-full p-3 animate-pulse">
              <ArrowUp className="h-8 w-8" />
            </div>
          </div>
        );
      
      case 'not-centered':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 text-white rounded-full p-3 animate-pulse">
              <Move className="h-8 w-8" />
            </div>
          </div>
        );
      
      case 'good':
        return null;
      
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Oval face guide */}
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        "w-1/3 h-1/2 border-2 rounded-full",
        position === 'good' ? "border-green-500" : "border-yellow-500",
        position === 'good' && "shadow-[0_0_0_4px_rgba(34,197,94,0.25)]"
      )} />
      
      {/* Position guide */}
      {renderPositionGuide()}
      
      {/* Progress bar when capturing */}
      {isCapturing && (
        <div className="absolute bottom-4 left-4 right-4">
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {/* Status text */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <div className={cn(
          "inline-block px-3 py-1 rounded-full text-sm font-medium",
          position === 'good' ? "bg-green-500/80 text-white" : "bg-yellow-500/80 text-white"
        )}>
          {position === 'too-far' && "Move closer"}
          {position === 'too-close' && "Move back"}
          {position === 'not-centered' && "Center your face"}
          {position === 'good' && (isCapturing ? "Hold still..." : "Perfect position!")}
        </div>
      </div>
    </div>
  );
}
