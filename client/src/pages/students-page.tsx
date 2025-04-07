import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, UserPlus, Filter, ChevronDown } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";

// Mock API route for fetching students - we'll implement this on the backend later
const STUDENTS_API = "/api/students";

export default function StudentsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  // Fetch all students data
  const { data: students = [], isLoading } = useQuery<(User & { courses?: number })[]>({
    queryKey: [STUDENTS_API],
    enabled: user?.role === "lecturer",
  });

  // Fetch departments
  const { data: departments = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['/api/departments'],
  });

  // Get unique years for filters
  const years = Array.from(new Set(students.map((student) => student.year).filter(Boolean) as number[]));

  // Filter students based on search and filters
  const filteredStudents = students.filter((student) => {
    // Only include students (not lecturers)
    if (student.role !== "student") return false;

    // Search filter
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchQuery.toLowerCase()));

    // Department filter
    const matchesDepartment = !departmentFilter || student.departmentId === parseInt(departmentFilter);

    // Year filter
    const matchesYear = !yearFilter || student.year === yearFilter;

    return matchesSearch && matchesDepartment && matchesYear;
  });

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Students</h2>
          <Breadcrumb className="mt-1">
            <BreadcrumbItem>
              <BreadcrumbLink href="/lecturer">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink>Students</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
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
              <option key={dept.id} value={dept.id}>
                {dept.name}
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

      {/* Students table */}
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Face Data</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <UserAvatar name={student.name} className="h-8 w-8" />
                      <span>{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>{departments.find(d => d.id === student.departmentId)?.name || 'Unknown'}</TableCell>
                  <TableCell>{student.year}</TableCell>
                  <TableCell>{student.courses || 0}</TableCell>
                  <TableCell>
                    {student.faceData ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        Not Verified
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No students found
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