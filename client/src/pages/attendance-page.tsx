import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatTime } from "@/lib/utils";
import { Attendance, Course, User } from "@shared/schema";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, CalendarIcon, Download, Filter } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";

export default function AttendancePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [dateOpen, setDateOpen] = useState(false);

  const isStudent = user?.role === "student";
  const isLecturer = user?.role === "lecturer";

  // Fetch attendance records
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery<
    (Attendance & { student?: User; course?: Course })[]
  >({
    queryKey: [isStudent ? "/api/attendance/student" : "/api/attendance"],
  });

  // Fetch courses for filter
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Get unique dates for the date picker filter
  const uniqueDates = Array.from(
    new Set(
      attendanceRecords.map((record) => {
        const date = new Date(record.timestamp);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      })
    )
  ).map((dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  });

  // Filter attendance records
  const filteredAttendance = attendanceRecords.filter((record) => {
    // Course filter
    const matchesCourse = !courseFilter || record.courseId === courseFilter;

    // Date filter
    const matchesDate = !dateFilter || isOnSameDay(new Date(record.timestamp), dateFilter);

    // Search filter for lecturer (search by student name)
    const matchesSearch = isStudent
      ? true
      : record.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.student?.studentId?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCourse && matchesDate && matchesSearch;
  });

  function isOnSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Records</h2>
          <Breadcrumb className="mt-1">
            <BreadcrumbItem>
              <BreadcrumbLink href={isStudent ? "/student" : "/lecturer"}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink>Attendance</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4 mb-6">
        {isLecturer && (
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name or ID..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={courseFilter || ""}
          onChange={(e) => setCourseFilter(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name}
            </option>
          ))}
        </select>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? formatDate(dateFilter) : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter || undefined}
              onSelect={(date) => {
                if (date) {
                  setDateFilter(date);
                  setDateOpen(false);
                }
              }}
              disabled={(date) => {
                return !uniqueDates.some((d) => isOnSameDay(d, date));
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {dateFilter && (
          <Button variant="ghost" onClick={() => setDateFilter(null)}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {isLecturer && <TableHead className="w-[200px]">Student</TableHead>}
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                {isLecturer && <TableHead>Network</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.map((record) => (
                <TableRow key={record.id}>
                  {isLecturer && (
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <UserAvatar
                          name={record.student?.name || "Unknown"}
                          className="h-8 w-8"
                        />
                        <div>
                          <div>{record.student?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.student?.studentId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="font-medium">
                      {record.course?.code} - {record.course?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {record.course?.department}, Year {record.course?.year}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(record.timestamp)}</TableCell>
                  <TableCell>{formatTime(record.timestamp)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      {record.status}
                    </span>
                  </TableCell>
                  {isLecturer && (
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        School Network
                      </span>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredAttendance.length === 0 && !isLoadingAttendance && (
                <TableRow>
                  <TableCell
                    colSpan={isLecturer ? 6 : 4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No attendance records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}