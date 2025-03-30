import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  PlusCircle, 
  Trash2, 
  Edit, 
  Users, 
  BookOpen, 
  Building, 
  GraduationCap,
  AlertCircle
} from "lucide-react";
import { 
  Department, 
  Program, 
  User, 
  Course, 
  InsertDepartment, 
  InsertProgram 
} from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("departments");
  
  // State for department management
  const [showAddDepartmentDialog, setShowAddDepartmentDialog] = useState(false);
  const [newDepartment, setNewDepartment] = useState<InsertDepartment>({
    name: "",
    description: ""
  });
  
  // State for program management
  const [showAddProgramDialog, setShowAddProgramDialog] = useState(false);
  const [newProgram, setNewProgram] = useState<InsertProgram>({
    name: "",
    code: "",
    departmentId: 0,
    description: "",
    durationYears: 4
  });
  
  // Fetch data based on active tab
  const { 
    data: departments = [], 
    isLoading: isLoadingDepartments,
    refetch: refetchDepartments
  } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: activeTab === "departments" || activeTab === "programs"
  });
  
  const { 
    data: programs = [], 
    isLoading: isLoadingPrograms,
    refetch: refetchPrograms
  } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
    enabled: activeTab === "programs"
  });
  
  const { 
    data: courses = [], 
    isLoading: isLoadingCourses 
  } = useQuery<Course[]>({
    queryKey: ["/api/courses/all"],
    enabled: activeTab === "courses"
  });
  
  const { 
    data: users = [], 
    isLoading: isLoadingUsers 
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: activeTab === "users"
  });
  
  // Mutations
  const addDepartmentMutation = useMutation({
    mutationFn: async (department: InsertDepartment) => {
      const res = await apiRequest("POST", "/api/departments", department);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Department added",
        description: "New department has been successfully added.",
      });
      setShowAddDepartmentDialog(false);
      setNewDepartment({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add department",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const addProgramMutation = useMutation({
    mutationFn: async (program: InsertProgram) => {
      const res = await apiRequest("POST", "/api/programs", program);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Program added",
        description: "New program has been successfully added.",
      });
      setShowAddProgramDialog(false);
      setNewProgram({
        name: "",
        code: "",
        departmentId: 0,
        description: "",
        durationYears: 4
      });
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add program",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle department submission
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.name) {
      toast({
        title: "Validation Error",
        description: "Department name is required",
        variant: "destructive",
      });
      return;
    }
    addDepartmentMutation.mutate(newDepartment);
  };
  
  // Handle program submission
  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgram.name || !newProgram.code || !newProgram.departmentId) {
      toast({
        title: "Validation Error",
        description: "Program name, code and department are required",
        variant: "destructive",
      });
      return;
    }
    addProgramMutation.mutate(newProgram);
  };

  // Stats data calculations
  const totalStudents = users.filter(user => user.role === "student").length;
  const totalLecturers = users.filter(user => user.role === "lecturer").length;
  const totalCourses = courses.length;
  const totalPrograms = programs.length;
  
  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <Breadcrumb className="mt-1">
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink>Admin</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              Academic departments in the system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programs</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPrograms}</div>
            <p className="text-xs text-muted-foreground">
              Academic programs registered
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Active and inactive courses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalStudents} students, {totalLecturers} lecturers
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main management tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Department Management</h3>
            <Button onClick={() => setShowAddDepartmentDialog(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>
          
          {isLoadingDepartments ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : departments.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No departments</AlertTitle>
              <AlertDescription>
                No departments found. Add a department to start organizing your faculty.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell>{dept.id}</TableCell>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell>{dept.description || "N/A"}</TableCell>
                        <TableCell>{new Date(dept.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          
          {/* Add Department Dialog */}
          <Dialog open={showAddDepartmentDialog} onOpenChange={setShowAddDepartmentDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Create a new academic department in the system.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddDepartment}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dept-name">Department Name *</Label>
                    <Input
                      id="dept-name"
                      placeholder="e.g., Computer Science"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="dept-desc">Description</Label>
                    <Input
                      id="dept-desc"
                      placeholder="Brief description of the department"
                      value={newDepartment.description || ""}
                      onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setShowAddDepartmentDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addDepartmentMutation.isPending}
                  >
                    {addDepartmentMutation.isPending ? "Adding..." : "Add Department"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Program Management</h3>
            <Button 
              onClick={() => setShowAddProgramDialog(true)}
              disabled={departments.length === 0}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Program
            </Button>
          </div>
          
          {departments.length === 0 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Departments Required</AlertTitle>
              <AlertDescription>
                You need to create departments before adding programs.
              </AlertDescription>
            </Alert>
          )}
          
          {isLoadingPrograms ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : programs.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No programs</AlertTitle>
              <AlertDescription>
                No academic programs found. Add a program to organize your courses.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Duration (Years)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map((program) => {
                      const department = departments.find(d => d.id === program.departmentId);
                      return (
                        <TableRow key={program.id}>
                          <TableCell className="font-medium">{program.code}</TableCell>
                          <TableCell>{program.name}</TableCell>
                          <TableCell>{department?.name || "Unknown"}</TableCell>
                          <TableCell>{program.durationYears}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          
          {/* Add Program Dialog */}
          <Dialog open={showAddProgramDialog} onOpenChange={setShowAddProgramDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Program</DialogTitle>
                <DialogDescription>
                  Create a new academic program in the system.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddProgram}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="program-name">Program Name *</Label>
                    <Input
                      id="program-name"
                      placeholder="e.g., Bachelor of Computer Science"
                      value={newProgram.name}
                      onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="program-code">Program Code *</Label>
                    <Input
                      id="program-code"
                      placeholder="e.g., BCS"
                      value={newProgram.code}
                      onChange={(e) => setNewProgram({...newProgram, code: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="program-dept">Department *</Label>
                    <Select 
                      value={newProgram.departmentId ? String(newProgram.departmentId) : ""} 
                      onValueChange={(value) => setNewProgram({
                        ...newProgram, 
                        departmentId: parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={String(dept.id)}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="program-desc">Description</Label>
                    <Input
                      id="program-desc"
                      placeholder="Brief description of the program"
                      value={newProgram.description || ""}
                      onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="program-duration">Duration (Years)</Label>
                    <Select 
                      value={String(newProgram.durationYears)} 
                      onValueChange={(value) => setNewProgram({
                        ...newProgram, 
                        durationYears: parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setShowAddProgramDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addProgramMutation.isPending}
                  >
                    {addProgramMutation.isPending ? "Adding..." : "Add Program"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Course Management</h3>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>
          
          {isLoadingCourses ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : courses.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No courses</AlertTitle>
              <AlertDescription>
                No courses found. Add a course to start organizing your class schedule.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.department}</TableCell>
                        <TableCell>{course.year}</TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            course.isActive 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {course.isActive ? "Active" : "Inactive"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">User Management</h3>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
          
          {isLoadingUsers ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : users.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No users</AlertTitle>
              <AlertDescription>
                No users found in the system.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin" 
                              ? "bg-purple-100 text-purple-800" 
                              : user.role === "lecturer"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </div>
                        </TableCell>
                        <TableCell>{user.department || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}