import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LecturerCourseCard } from "@/components/lecturer/course-card";
import { LecturerAttendanceTable } from "@/components/lecturer/attendance-table";
import { AddCourseModal } from "@/components/lecturer/add-course-modal";
import { LecturerSidebar } from "@/components/lecturer/sidebar";
import { StatsCard } from "@/components/lecturer/stats-card";
import { Course, Attendance, User } from "@shared/schema";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LecturerDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  
  // Fetch courses
  const { 
    data: courses = [], 
    isLoading: isLoadingCourses 
  } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    enabled: !!user,
  });
  
  // Get active course (assuming only one can be active at a time)
  const activeCourse = courses.find(course => course.isActive);
  
  // Fetch today's attendance for active course
  const { 
    data: todayAttendance = [], 
    isLoading: isLoadingAttendance 
  } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance/course', activeCourse?.id, 'today'],
    enabled: !!activeCourse,
  });
  
  // Mock data for stats (in a real app, this would come from API)
  const totalStudents = 128; // This would come from actual data
  
  // Activate/deactivate course mutation
  const toggleCourseMutation = useMutation({
    mutationFn: async ({ courseId, isActive }: { courseId: number, isActive: boolean }) => {
      const res = await apiRequest('POST', `/api/courses/${courseId}/activate`, { isActive });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Course updated",
        description: `Course has been ${activeCourse ? 'deactivated' : 'activated'} successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update course",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  function handleToggleCourseActive(courseId: number, isActive: boolean) {
    toggleCourseMutation.mutate({ courseId, isActive });
  }
  
  // View course details
  function handleViewCourseDetails(courseId: number) {
    // For now just show a toast, in a full implementation this would navigate to a course details page
    toast({
      title: "Course Details",
      description: `Viewing details for course ID: ${courseId}`,
    });
  }
  
  // View student attendance
  function handleViewStudentAttendance(studentId: number) {
    // For now just show a toast, in a full implementation this would navigate to a student details page
    toast({
      title: "Student Attendance",
      description: `Viewing attendance for student ID: ${studentId}`,
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <h1 className="text-xl font-semibold text-gray-800">FaceAttend</h1>
          </div>
          <div className="flex items-center">
            <span className="mr-3 text-sm font-medium">{user?.name}</span>
            <div className="relative">
              <UserAvatar name={user?.name || ""} className="w-8 h-8" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex">
        {/* Sidebar */}
        <LecturerSidebar />

        {/* Main Content Area */}
        <main className="flex-grow p-6 overflow-auto bg-gray-50">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Dashboard</h2>
              <p className="text-gray-600">Manage your courses and track student attendance</p>
            </div>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard 
              title="Total Courses" 
              value={courses.length} 
              icon="courses" 
            />
            <StatsCard 
              title="Total Students" 
              value={totalStudents} 
              icon="students" 
            />
            <StatsCard 
              title="Active Sessions" 
              value={courses.filter(c => c.isActive).length} 
              icon="active" 
            />
            <StatsCard 
              title="Today's Attendance" 
              value={todayAttendance.length} 
              icon="attendance" 
            />
          </div>

          {/* Active Course Section */}
          {activeCourse ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Active Course</h3>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleToggleCourseActive(activeCourse.id, false)}
                  disabled={toggleCourseMutation.isPending}
                >
                  {toggleCourseMutation.isPending ? "Deactivating..." : "Deactivate"}
                </Button>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h4 className="text-base font-medium text-gray-800">
                    {activeCourse.code}: {activeCourse.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {activeCourse.department}, {activeCourse.year}{getYearSuffix(activeCourse.year)} Year
                  </p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active since {activeCourse.activatedAt ? formatTime(activeCourse.activatedAt) : 'just now'}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-md mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-700 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Students Present:</span>
                    <span className="ml-2 text-sm font-semibold text-gray-800">
                      {todayAttendance.length} / {totalStudents}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {Math.round((todayAttendance.length / totalStudents) * 100)}% attendance rate
                  </span>
                </div>
              </div>
              
              <Button 
                variant="link" 
                className="text-primary hover:text-primary/80 text-sm p-0"
                onClick={() => handleViewCourseDetails(activeCourse.id)}
              >
                View attendance details
              </Button>
            </div>
          ) : (
            <Alert className="mb-6">
              <AlertTitle>No active course</AlertTitle>
              <AlertDescription>
                You don't have any active courses. Activate a course to allow students to mark their attendance.
              </AlertDescription>
            </Alert>
          )}

          {/* Course Management Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">My Courses</h3>
              <Button 
                onClick={() => setIsAddCourseModalOpen(true)}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Course
              </Button>
            </div>
            
            {isLoadingCourses ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-t-2 border-primary rounded-full animate-spin"></div>
              </div>
            ) : courses.length === 0 ? (
              <Alert>
                <AlertTitle>No courses found</AlertTitle>
                <AlertDescription>
                  You haven't created any courses yet. Click "Add Course" to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => (
                  <LecturerCourseCard
                    key={course.id}
                    course={course}
                    studentCount={25} // This would come from real data
                    onViewDetails={handleViewCourseDetails}
                    onToggleActive={handleToggleCourseActive}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Today's Attendance Section */}
          {activeCourse && (
            <LecturerAttendanceTable
              attendanceRecords={todayAttendance.map(record => ({ 
                ...record, 
                student: { 
                  id: record.studentId, 
                  name: `Student ${record.studentId}`, // This would come from real data
                  studentId: `ST${10000 + record.studentId}`, // This would come from real data
                  username: '',
                  password: '',
                  role: 'student' as const,
                  schoolId: null,
                  departmentId: null,
                  year: null,
                  email: '',
                  faceData: null
                } 
              }))}
              onViewAttendance={handleViewStudentAttendance}
              isLoading={isLoadingAttendance}
            />
          )}
        </main>
      </div>
      
      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={isAddCourseModalOpen}
        onClose={() => setIsAddCourseModalOpen(false)}
      />
    </div>
  );
}

function formatTime(date: Date | string | null): string {
  if (!date) return 'unknown time';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getYearSuffix(year: number | null): string {
  if (!year) return '';
  
  if (year === 1) return 'st';
  if (year === 2) return 'nd';
  if (year === 3) return 'rd';
  return 'th';
}
