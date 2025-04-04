import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserAvatar } from "@/components/ui/user-avatar";
import { StudentCourseCard } from "@/components/student/course-card";
import { StudentAttendanceTable } from "@/components/student/attendance-table";
import { FaceRecognitionModal } from "@/components/student/face-recognition-modal";
import { Course, Attendance } from "@shared/schema";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { AlertCircle, BellRing } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudentDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isFaceRecognitionOpen, setIsFaceRecognitionOpen] = useState(false);
  
  // Fetch courses
  const { 
    data: courses = [], 
    isLoading: isLoadingCourses 
  } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    enabled: !!user,
  });
  
  // Fetch active courses
  const { 
    data: activeCourses = [], 
    isLoading: isLoadingActiveCourses,
    error: activeCoursesError 
  } = useQuery<Course[]>({
    queryKey: ['/api/active-courses'],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds to check for newly activated courses
  });
  
  // Check if the student needs to register face data
  const needsFaceRegistration = activeCoursesError?.message === "Face verification required";
  
  // If the student hasn't registered their face data yet, show a modal
  const [showFaceRegistrationModal, setShowFaceRegistrationModal] = useState(false);
  
  useEffect(() => {
    if (needsFaceRegistration && user) {
      setShowFaceRegistrationModal(true);
    }
  }, [needsFaceRegistration, user]);
  
  // Fetch attendance records
  const { 
    data: attendanceRecords = [], 
    isLoading: isLoadingAttendance 
  } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance/student'],
    enabled: !!user,
  });
  
  // Mark attendance success handler
  function handleAttendanceSuccess() {
    toast({
      title: "Attendance marked",
      description: "Your attendance has been successfully recorded",
    });
    
    // Refresh attendance data
    queryClient.invalidateQueries({ queryKey: ['/api/attendance/student'] });
  }
  
  // Open face recognition modal for a course
  function handleMarkAttendance(courseId: number) {
    setSelectedCourseId(courseId);
    setIsFaceRecognitionOpen(true);
  }
  
  // View course details
  function handleViewCourseDetails(courseId: number) {
    // For now just show a toast, in a full implementation this would navigate to a course details page
    toast({
      title: "Course Details",
      description: `Viewing details for course ID: ${courseId}`,
    });
  }
  
  // View all attendance records
  function handleViewAllAttendance() {
    // For now just show a toast, in a full implementation this would navigate to an attendance page
    toast({
      title: "Attendance Records",
      description: "Viewing all attendance records",
    });
  }
  
  // Get selected course
  const selectedCourse = courses.find(course => course.id === selectedCourseId);

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
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome, {user?.name}</h2>
            <p className="text-gray-600">Student ID: {user?.studentId}</p>
          </div>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        </div>
        
        {/* Face Registration Alert */}
        {!user?.faceData && (
          <Alert className="mb-6 border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-500">Face verification required</AlertTitle>
            <AlertDescription>
              <p className="text-red-600 mb-2">
                You need to complete face verification before you can mark attendance for your courses.
              </p>
              <Button 
                size="sm" 
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={() => setShowFaceRegistrationModal(true)}
              >
                Register Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Active Class Alert */}
        {activeCourses.length > 0 && (
          <div className="bg-amber-500 bg-opacity-10 border-l-4 border-amber-500 p-4 rounded-md mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <BellRing className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-500">
                  {activeCourses.length === 1 
                    ? "Class is now active!" 
                    : `${activeCourses.length} classes are now active!`}
                </h3>
                <div className="mt-1 text-sm text-gray-700">
                  {activeCourses.length === 1 ? (
                    <p>{`${activeCourses[0].code}: ${activeCourses[0].name} is now in session. Mark your attendance with face recognition.`}</p>
                  ) : (
                    <p>Multiple classes are in session. Please mark your attendance for each active class.</p>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {activeCourses.map(course => (
                    <Button 
                      key={course.id}
                      onClick={() => handleMarkAttendance(course.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-sm"
                    >
                      Mark Attendance for {course.code}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Courses Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">My Courses</h2>
          
          {isLoadingCourses ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-t-2 border-primary rounded-full animate-spin"></div>
            </div>
          ) : courses.length === 0 ? (
            <Alert>
              <AlertTitle>No courses found</AlertTitle>
              <AlertDescription>
                You are not enrolled in any courses yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => {
                // Find the most recent attendance for this course
                const courseAttendance = attendanceRecords
                  .filter(record => record.courseId === course.id)
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                
                const lastAttended = courseAttendance.length > 0 
                  ? new Date(courseAttendance[0].timestamp) 
                  : null;
                
                return (
                  <StudentCourseCard
                    key={course.id}
                    course={course}
                    lastAttended={lastAttended}
                    onViewDetails={handleViewCourseDetails}
                    onMarkAttendance={course.isActive ? handleMarkAttendance : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance History Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Attendance</h2>
          
          <StudentAttendanceTable
            attendanceRecords={attendanceRecords.slice(0, 5)}
            courses={courses}
            onViewAll={handleViewAllAttendance}
            isLoading={isLoadingAttendance}
          />
        </div>
      </main>
      
      {/* Face Recognition Modal for attendance */}
      {selectedCourse && (
        <FaceRecognitionModal
          isOpen={isFaceRecognitionOpen}
          onClose={() => setIsFaceRecognitionOpen(false)}
          onSuccess={handleAttendanceSuccess}
          mode="verify"
        />
      )}
      
      {/* Face Registration Modal */}
      {user && (
        <FaceRecognitionModal
          isOpen={showFaceRegistrationModal}
          onClose={() => setShowFaceRegistrationModal(false)}
          onSuccess={(faceData) => {
            setShowFaceRegistrationModal(false);
            // Refresh user data and active courses
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            queryClient.invalidateQueries({ queryKey: ['/api/active-courses'] });
            toast({
              title: "Face registered successfully",
              description: "You can now mark attendance for your courses",
            });
          }}
          mode="register"
        />
      )}
    </div>
  );
}
