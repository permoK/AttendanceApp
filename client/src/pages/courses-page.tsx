import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Course } from "@shared/schema";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, Filter } from "lucide-react";
import { StudentCourseCard } from "@/components/student/course-card";
import { LecturerCourseCard } from "@/components/lecturer/course-card";
import { AddCourseModal } from "@/components/lecturer/add-course-modal";

export default function CoursesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  const isStudent = user?.role === "student";
  const isLecturer = user?.role === "lecturer";

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Get unique departments and years for filters
  const departments = [...new Set(courses.map((course) => course.department))];
  const years = [...new Set(courses.map((course) => course.year))];

  // Filter courses based on search and filters
  const filteredCourses = courses.filter((course) => {
    // Search filter
    const matchesSearch =
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase());

    // Department filter
    const matchesDepartment = !departmentFilter || course.department === departmentFilter;

    // Year filter
    const matchesYear = !yearFilter || course.year === yearFilter;

    return matchesSearch && matchesDepartment && matchesYear;
  });

  const handleViewCourseDetails = (courseId: number) => {
    // Implement course details view
    console.log("View course details", courseId);
  };

  const handleToggleCourseActive = (courseId: number, isActive: boolean) => {
    // Implement toggle course active
    console.log("Toggle course active", courseId, isActive);
  };

  const handleMarkAttendance = (courseId: number) => {
    // Implement mark attendance
    console.log("Mark attendance", courseId);
  };

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Courses</h2>
          <Breadcrumb className="mt-1">
            <BreadcrumbItem>
              <BreadcrumbLink href={isStudent ? "/student" : "/lecturer"}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink>Courses</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
        {isLecturer && (
          <Button onClick={() => setShowAddCourseModal(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={departmentFilter || ""}
            onChange={(e) => setDepartmentFilter(e.target.value || null)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={yearFilter || ""}
            onChange={(e) => setYearFilter(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course tabs for lecturer */}
      {isLecturer && (
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="active">Active Courses</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Courses</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <LecturerCourseCard
                  key={course.id}
                  course={course}
                  onViewDetails={handleViewCourseDetails}
                  onToggleActive={handleToggleCourseActive}
                />
              ))}
              {filteredCourses.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No courses found
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="active">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses
                .filter((course) => course.isActive)
                .map((course) => (
                  <LecturerCourseCard
                    key={course.id}
                    course={course}
                    onViewDetails={handleViewCourseDetails}
                    onToggleActive={handleToggleCourseActive}
                  />
                ))}
              {filteredCourses.filter((course) => course.isActive).length === 0 && !isLoading && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No active courses found
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="inactive">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses
                .filter((course) => !course.isActive)
                .map((course) => (
                  <LecturerCourseCard
                    key={course.id}
                    course={course}
                    onViewDetails={handleViewCourseDetails}
                    onToggleActive={handleToggleCourseActive}
                  />
                ))}
              {filteredCourses.filter((course) => !course.isActive).length === 0 && !isLoading && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No inactive courses found
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Student courses */}
      {isStudent && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <StudentCourseCard
              key={course.id}
              course={course}
              onViewDetails={handleViewCourseDetails}
              onMarkAttendance={course.isActive ? handleMarkAttendance : undefined}
            />
          ))}
          {filteredCourses.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No courses found
            </div>
          )}
        </div>
      )}

      {/* Add Course Modal for lecturer */}
      {isLecturer && (
        <AddCourseModal
          isOpen={showAddCourseModal}
          onClose={() => setShowAddCourseModal(false)}
        />
      )}
    </DashboardLayout>
  );
}