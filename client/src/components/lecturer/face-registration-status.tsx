import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { User } from '@shared/schema';

interface FaceRegistrationStatusProps {
  courseId?: number;
}

export function FaceRegistrationStatus({ courseId }: FaceRegistrationStatusProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch students for the course
  const { 
    data: students = [], 
    isLoading,
    refetch
  } = useQuery<(User & { isEnrolled?: boolean })[]>({
    queryKey: [courseId ? `/api/courses/${courseId}/students` : '/api/students'],
    enabled: !!courseId,
  });
  
  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate statistics
  const totalStudents = students.length;
  const registeredStudents = students.filter(student => student.faceData).length;
  const registrationRate = totalStudents > 0 ? Math.round((registeredStudents / totalStudents) * 100) : 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Face Registration Status</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          className="h-8 gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Students</p>
            <p className="text-2xl font-semibold">{totalStudents}</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground mb-1">Registered</p>
            <p className="text-2xl font-semibold">{registeredStudents}</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground mb-1">Completion</p>
            <p className="text-2xl font-semibold">{registrationRate}%</p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Students table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-t-2 border-primary rounded-full animate-spin"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserAvatar name={student.name} className="h-8 w-8" />
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>
                      {student.faceData ? (
                        <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                          <UserCheck className="h-3 w-3" />
                          Registered
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-500 border-red-200 gap-1">
                          <UserX className="h-3 w-3" />
                          Not Registered
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
