import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Course } from "@shared/schema";
import { Users, Calendar } from 'lucide-react';

interface LecturerCourseCardProps {
  course: Course;
  studentCount?: number;
  onViewDetails: (courseId: number) => void;
  onToggleActive?: (courseId: number, isActive: boolean) => void;
}

export function LecturerCourseCard({ 
  course, 
  studentCount = 0,
  onViewDetails,
  onToggleActive
}: LecturerCourseCardProps) {
  const { id, code, name, departmentId, year, isActive, schedule } = course;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-base font-medium text-gray-800">{code}: {name}</h4>
          <StatusBadge variant={isActive ? "active" : "inactive"}>
            {isActive ? "Active" : "Inactive"}
          </StatusBadge>
        </div>
        <p className="text-sm text-gray-600 mb-3">Dept ID: {departmentId}, {year}{getYearSuffix(year)} Year</p>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Users className="h-4 w-4 mr-1" />
          <span>{studentCount} students</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{schedule || "Schedule not set"}</span>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex justify-between items-center w-full">
          <Button 
            variant="link" 
            className="text-primary hover:text-primary/80 text-sm p-0"
            onClick={() => onViewDetails(id)}
          >
            View Details
          </Button>
          
          {onToggleActive && (
            <Button
              variant={isActive ? "destructive" : "default"}
              size="sm"
              onClick={() => onToggleActive(id, !isActive)}
            >
              {isActive ? "Deactivate" : "Activate"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function getYearSuffix(year: number | null): string {
  if (!year) return '';
  
  if (year === 1) return 'st';
  if (year === 2) return 'nd';
  if (year === 3) return 'rd';
  return 'th';
}