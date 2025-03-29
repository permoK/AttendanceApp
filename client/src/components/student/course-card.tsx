import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Course } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CourseCardProps {
  course: Course;
  lastAttended?: Date | string | null;
  onViewDetails: (courseId: number) => void;
  onMarkAttendance?: (courseId: number) => void;
}

export function StudentCourseCard({ 
  course, 
  lastAttended, 
  onViewDetails,
  onMarkAttendance
}: CourseCardProps) {
  const { id, code, name, department, isActive } = course;
  const { user } = useAuth();
  const hasFaceData = user?.faceData !== null && user?.faceData !== undefined;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base font-medium text-gray-800">{code}: {name}</h3>
          <StatusBadge variant={isActive ? "active" : "inactive"}>
            {isActive ? "Active" : "Inactive"}
          </StatusBadge>
        </div>
        <p className="text-sm text-gray-600 mb-3">{department}</p>
        <div className="flex items-center text-sm text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>{course.schedule || "Schedule not set"}</span>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex justify-between items-center w-full">
          <span className="text-xs text-gray-500">
            {lastAttended 
              ? `Last attended: ${formatDate(lastAttended)}` 
              : "Not attended yet"}
          </span>
          <div className="flex space-x-2">
            {isActive && onMarkAttendance && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        size="sm" 
                        onClick={() => onMarkAttendance(id)} 
                        className="bg-amber-500 hover:bg-amber-600"
                        disabled={!hasFaceData}
                      >
                        Mark Attendance
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!hasFaceData && (
                    <TooltipContent>
                      <p>Face verification required before marking attendance</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewDetails(id)}
            >
              Details
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
