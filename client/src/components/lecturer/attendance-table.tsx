import { useState } from 'react';
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
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/utils";
import { Attendance, User } from "@shared/schema";
import { UserAvatar } from '@/components/ui/user-avatar';
import { Search } from 'lucide-react';

interface LecturerAttendanceTableProps {
  attendanceRecords: (Attendance & { student?: User })[];
  onViewAttendance?: (studentId: number) => void;
  isLoading?: boolean;
}

export function LecturerAttendanceTable({ 
  attendanceRecords, 
  onViewAttendance,
  isLoading = false
}: LecturerAttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter attendance records by search term
  const filteredRecords = searchTerm
    ? attendanceRecords.filter(record => 
        record.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.student?.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : attendanceRecords;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Today's Attendance</h3>
        <div className="relative w-64">
          <Input
            placeholder="Search by name or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading attendance records...
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {searchTerm 
                      ? "No matching records found." 
                      : "No attendance records for today."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <UserAvatar 
                          name={record.student?.name || "Student"} 
                          className="h-8 w-8 mr-4"
                        />
                        <div className="text-sm font-medium text-gray-800">
                          {record.student?.name || `Student ID: ${record.studentId}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {record.student?.studentId || `ID: ${record.studentId}`}
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
                    <TableCell>
                      <Button 
                        variant="link" 
                        className="text-primary hover:text-primary/80 text-sm p-0"
                        onClick={() => onViewAttendance && onViewAttendance(record.studentId)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {filteredRecords.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-700">
              Showing {filteredRecords.length} of {attendanceRecords.length} records
            </p>
            
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
