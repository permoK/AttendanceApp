import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";
import { Attendance, Course } from "@shared/schema";

interface AttendanceTableProps {
  attendanceRecords: (Attendance & { course?: Course })[];
  courses: Course[];
  onViewAll?: () => void;
  isLoading?: boolean;
}

export function StudentAttendanceTable({ 
  attendanceRecords, 
  courses,
  onViewAll,
  isLoading = false
}: AttendanceTableProps) {
  // Get course name by ID
  const getCourseById = (courseId: number) => {
    return courses.find(course => course.id === courseId);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Loading attendance records...
                </TableCell>
              </TableRow>
            ) : attendanceRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  No attendance records found.
                </TableCell>
              </TableRow>
            ) : (
              attendanceRecords.map((record) => {
                const course = getCourseById(record.courseId);
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-800">
                        {course ? `${course.code}: ${course.name}` : `Course ID: ${record.courseId}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatDate(record.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatTime(record.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        variant={record.status === "present" ? "present" : "absent"}
                      >
                        {record.status === "present" ? "Present" : "Absent"}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {onViewAll && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-right">
          <Button 
            variant="link" 
            className="text-primary hover:text-primary/80 text-sm"
            onClick={onViewAll}
          >
            View all
          </Button>
        </div>
      )}
    </div>
  );
}
