import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { insertCourseSchema, type InsertCourse } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogContent, Dialog } from "@/components/ui/dialog";
import type { School, Department, Program, User } from "@shared/schema";

interface AddCourseModalProps {
  onClose: () => void;
  open: boolean;
}

export function AddCourseModal({ onClose, open }: AddCourseModalProps) {
  const queryClient = useQueryClient();
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);

  const form = useForm<InsertCourse>({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      code: "",
      name: "",
      schoolId: 0,
      departmentId: 0,
      programId: 0,
      year: 1,
      lecturerId: 0,
      schedule: "",
      isActive: false,
      activatedAt: null
    },
  });

  // Fetch schools
  const { data: schools = [], isLoading: isLoadingSchools } = useQuery<School[]>({
    queryKey: ["/api/schools"],
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch departments
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch programs
  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
    enabled: !!selectedDepartment,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch lecturers
  const { data: lecturers = [], isLoading: isLoadingLecturers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const addCourseMutation = useMutation({
    mutationFn: async (course: InsertCourse) => {
      const res = await apiRequest("POST", "/api/courses", course);
      if (!res.ok) throw new Error("Failed to add course");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course added",
        description: "Course has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCourse) => {
    addCourseMutation.mutate(data);
  };

  const handleSchoolSelect = (value: string) => {
    const schoolId = parseInt(value);
    setSelectedSchool(schoolId);
    setSelectedDepartment(null);
    form.setValue('schoolId', schoolId);
    form.setValue('departmentId', 0);
    form.setValue('programId', 0);
  };

  const handleDepartmentSelect = (value: string) => {
    const departmentId = parseInt(value);
    setSelectedDepartment(departmentId);
    form.setValue('departmentId', departmentId);
    form.setValue('programId', 0);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="schoolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School *</FormLabel>
                  <Select 
                    onValueChange={handleSchoolSelect} 
                    value={field.value?.toString()}
                    disabled={isLoadingSchools}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingSchools ? "Loading schools..." : "Select school"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id.toString()}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            { (
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select 
                      onValueChange={handleDepartmentSelect} 
                      value={field.value?.toString()}
                      disabled={isLoadingDepartments}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingDepartments ? "Loading departments..." : "Select department"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments
                          .filter(dept => dept.schoolId === selectedSchool)
                          .map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedDepartment && (
              <FormField
                control={form.control}
                name="programId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                      disabled={isLoadingPrograms}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingPrograms ? "Loading programs..." : "Select program"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programs
                          .filter(prog => prog.departmentId === selectedDepartment)
                          .map((prog) => (
                            <SelectItem key={prog.id} value={prog.id.toString()}>
                              {prog.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter course code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter course name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lecturerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lecturer *</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString()}
                    disabled={isLoadingLecturers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingLecturers ? "Loading lecturers..." : "Select lecturer"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lecturers
                        .filter(lecturer => lecturer.role === "lecturer")
                        .map((lecturer) => (
                          <SelectItem key={lecturer.id} value={lecturer.id.toString()}>
                            {lecturer.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter course schedule" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={addCourseMutation.isPending}>
                {addCourseMutation.isPending ? "Adding..." : "Add Course"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 