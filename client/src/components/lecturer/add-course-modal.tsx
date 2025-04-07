import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertCourseSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Course form schema
const courseFormSchema = insertCourseSchema.pick({
  code: true,
  name: true,
  departmentId: true,
  schoolId: true,
  programId: true,
  year: true,
  schedule: true,
});

export function AddCourseModal({ isOpen, onClose }: AddCourseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Fetch schools
  const { data: schools = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['/api/schools'],
  });
  
  // Fetch departments
  const { data: departments = [] } = useQuery<{ id: number; name: string; schoolId: number }[]>({
    queryKey: ['/api/departments'],
    enabled: !!selectedSchool,
  });
  
  // Fetch programs
  const { data: programs = [] } = useQuery<{ id: number; name: string; departmentId: number }[]>({
    queryKey: ['/api/programs'],
    enabled: !!selectedDepartment,
  });
  
  // Create form
  const form = useForm<z.infer<typeof courseFormSchema>>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: '',
      name: '',
      schoolId: undefined,
      departmentId: undefined,
      programId: undefined,
      year: undefined,
      schedule: '',
    },
  });

  // Handle school selection
  const handleSchoolSelect = (value: string) => {
    const schoolId = parseInt(value);
    setSelectedSchool(schoolId);
    setSelectedDepartment(null);
    form.setValue('schoolId', schoolId);
    form.setValue('departmentId', 0);
    form.setValue('programId', 0);
  };

  // Handle department selection
  const handleDepartmentSelect = (value: string) => {
    const departmentId = parseInt(value);
    setSelectedDepartment(departmentId);
    form.setValue('departmentId', departmentId);
    form.setValue('programId', 0);
  };

  async function onSubmit(values: z.infer<typeof courseFormSchema>) {
    try {
      setIsSubmitting(true);
      await apiRequest('POST', '/api/courses', values);
      
      toast({
        title: 'Course created',
        description: `${values.code}: ${values.name} has been created successfully.`,
      });
      
      // Invalidate courses query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      
      // Reset form and close modal
      form.reset();
      onClose();
    } catch (error) {
      console.log("Error: ", error)
      toast({
        title: 'Course creation failed',
        description: error instanceof Error ? error.message : 'Failed to create course',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. CSC301" {...field} />
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
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Database Systems" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="schoolId" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School</FormLabel>
                  <Select 
                    onValueChange={handleSchoolSelect} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select School" />
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
            
            {selectedSchool && (
              <FormField
                control={form.control}
                name="departmentId" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select 
                      onValueChange={handleDepartmentSelect} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
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
                    <FormLabel>Program</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Program" />
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
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                      <SelectItem value="5">5th Year</SelectItem>
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
                    <Input placeholder="e.g. MWF 10:00 AM - 11:30 AM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Course"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
