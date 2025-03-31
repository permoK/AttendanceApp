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
import { Checkbox } from "@/components/ui/checkbox";
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
  InsertProgram,
  InsertCourse,
  InsertUser,
  School,
  InsertSchool
} from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("schools");
  
  // State for school management
  const [showAddSchoolDialog, setShowAddSchoolDialog] = useState(false);
  const [showEditSchoolDialog, setShowEditSchoolDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [newSchool, setNewSchool] = useState<InsertSchool>({
    name: "",
    description: ""
  });
  
  // State for department management
  const [showAddDepartmentDialog, setShowAddDepartmentDialog] = useState(false);
  const [newDepartment, setNewDepartment] = useState<InsertDepartment>({
    name: "",
    schoolId: 0,
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
  
  // State for edit department management
  const [showEditDepartmentDialog, setShowEditDepartmentDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  // State for edit program management
  const [showEditProgramDialog, setShowEditProgramDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  
  // Course state
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false);
  const [showEditCourseDialog, setShowEditCourseDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState<InsertCourse>({
    code: "",
    name: "",
    departmentId: 0,
    year: 1,
    lecturerId: 0,
    schedule: "",
    isActive: false,
    activatedAt: null
  });

  // User state
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<InsertUser>({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "student",
    studentId: "",
    schoolId: undefined,
    departmentId: undefined,
    programId: undefined,
    year: undefined,
    faceData: null
  });
  
  // Fetch data based on active tab
  const { 
    data: schools = [], 
    isLoading: isLoadingSchools,
    refetch: refetchSchools
  } = useQuery<School[]>({
    queryKey: ["/api/schools"],
    enabled: activeTab === "schools" || activeTab === "departments" || activeTab === "programs"
  });
  
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
  const addSchoolMutation = useMutation({
    mutationFn: async (school: InsertSchool) => {
      const res = await apiRequest("POST", "/api/schools", school);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "School added",
        description: "New school has been successfully added.",
      });
      setShowAddSchoolDialog(false);
      setNewSchool({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add school",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateSchoolMutation = useMutation({
    mutationFn: async ({ id, school }: { id: number; school: InsertSchool }) => {
      const res = await apiRequest("PUT", `/api/schools/${id}`, school);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "School updated",
        description: "School has been successfully updated.",
      });
      setShowEditSchoolDialog(false);
      setSelectedSchool(null);
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update school",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSchoolMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/schools/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "School deleted",
        description: "School has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete school",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
      setNewDepartment({
        name: "",
        schoolId: 0,
        description: ""
      });
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
  
  // Department mutations
  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, department }: { id: number; department: InsertDepartment }) => {
      const res = await apiRequest("PUT", `/api/departments/${id}`, department);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Department updated",
        description: "Department has been successfully updated.",
      });
      setShowEditDepartmentDialog(false);
      setSelectedDepartment(null);
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/departments/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Department deleted",
        description: "Department has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Program mutations
  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, program }: { id: number; program: InsertProgram }) => {
      const res = await apiRequest("PUT", `/api/programs/${id}`, program);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Program updated",
        description: "Program has been successfully updated.",
      });
      setShowEditProgramDialog(false);
      setSelectedProgram(null);
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update program",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/programs/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Program deleted",
        description: "Program has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete program",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Course mutations
  const addCourseMutation = useMutation({
    mutationFn: async (course: InsertCourse) => {
      const res = await apiRequest("POST", "/api/courses", course);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course added",
        description: "Course has been successfully added.",
      });
      setShowAddCourseDialog(false);
      setNewCourse({
        name: "",
        code: "",
        departmentId: 0,
        year: 1,
        lecturerId: 0,
        schedule: "",
        isActive: false,
        activatedAt: null
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, course }: { id: number; course: InsertCourse }) => {
      const res = await apiRequest("PUT", `/api/courses/${id}`, course);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course updated",
        description: "Course has been successfully updated.",
      });
      setShowEditCourseDialog(false);
      setSelectedCourse(null);
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/courses/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Course deleted",
        description: "Course has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // User mutations
  const addUserMutation = useMutation({
    mutationFn: async (user: InsertUser) => {
      const res = await apiRequest("POST", "/api/users", user);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User added",
        description: "User has been successfully added.",
      });
      setShowAddUserDialog(false);
      setNewUser({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "student",
        studentId: "",
        schoolId: undefined,
        departmentId: undefined,
        programId: undefined,
        year: undefined,
        faceData: null
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, user }: { id: number; user: Partial<InsertUser> }) => {
      const res = await apiRequest("PUT", `/api/users/${id}`, user);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User has been successfully updated.",
      });
      setShowEditUserDialog(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "User has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // School handlers
  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name) {
      toast({
        title: "Validation error",
        description: "School name is required",
        variant: "destructive",
      });
      return;
    }
    addSchoolMutation.mutate(newSchool);
  };

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setNewSchool({
      name: school.name,
      description: school.description || ""
    });
    setShowEditSchoolDialog(true);
  };

  const handleUpdateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !newSchool.name) {
      toast({
        title: "Validation error",
        description: "School name is required",
        variant: "destructive",
      });
      return;
    }
    updateSchoolMutation.mutate({
      id: selectedSchool.id,
      school: newSchool
    });
  };

  const handleDeleteSchool = (id: number) => {
    if (window.confirm("Are you sure you want to delete this school?")) {
      deleteSchoolMutation.mutate(id);
    }
  };

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

  // Department handlers
  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setNewDepartment({
      name: department.name,
      schoolId: department.schoolId,
      description: department.description || ""
    });
    setShowEditDepartmentDialog(true);
  };

  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment || !newDepartment.name) {
      toast({
        title: "Validation Error",
        description: "Department name is required",
        variant: "destructive",
      });
      return;
    }
    updateDepartmentMutation.mutate({
      id: selectedDepartment.id,
      department: newDepartment
    });
  };

  const handleDeleteDepartment = (id: number) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      deleteDepartmentMutation.mutate(id);
    }
  };

  // Program handlers
  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setNewProgram({
      name: program.name,
      code: program.code,
      departmentId: program.departmentId,
      description: program.description || "",
      durationYears: program.durationYears
    });
    setShowEditProgramDialog(true);
  };

  const handleUpdateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !newProgram.name || !newProgram.code || !newProgram.departmentId) {
      toast({
        title: "Validation Error",
        description: "Program name, code and department are required",
        variant: "destructive",
      });
      return;
    }
    updateProgramMutation.mutate({
      id: selectedProgram.id,
      program: newProgram
    });
  };

  const handleDeleteProgram = (id: number) => {
    if (window.confirm("Are you sure you want to delete this program?")) {
      deleteProgramMutation.mutate(id);
    }
  };

  // Course handlers
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code || !newCourse.departmentId) {
      toast({
        title: "Validation Error",
        description: "Course name, code and department are required",
        variant: "destructive",
      });
      return;
    }
    addCourseMutation.mutate(newCourse);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setNewCourse({
      name: course.name,
      code: course.code,
      departmentId: course.departmentId,
      year: course.year,
      lecturerId: course.lecturerId,
      schedule: course.schedule || "",
      isActive: course.isActive || false,
      activatedAt: course.activatedAt
    });
    setShowEditCourseDialog(true);
  };

  const handleUpdateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newCourse.name || !newCourse.code || !newCourse.departmentId) {
      toast({
        title: "Validation Error",
        description: "Course name, code and department are required",
        variant: "destructive",
      });
      return;
    }
    updateCourseMutation.mutate({
      id: selectedCourse.id,
      course: newCourse
    });
  };

  const handleDeleteCourse = (id: number) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      deleteCourseMutation.mutate(id);
    }
  };

  // User handlers
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }
    if (newUser.role === "student" && (!newUser.departmentId || !newUser.year)) {
      toast({
        title: "Validation Error",
        description: "Department and year are required for students",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await addUserMutation.mutateAsync(newUser);
      setShowAddUserDialog(false);
      setNewUser({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "student",
        studentId: "",
        schoolId: undefined,
        departmentId: undefined,
        programId: undefined,
        year: undefined,
        faceData: null
      });
    } catch (error) {
      console.error("Failed to add user:", error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setNewUser({
      name: user.name,
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      studentId: user.studentId || "",
      schoolId: user.schoolId || undefined,
      departmentId: user.departmentId || undefined,
      year: user.year || undefined,
      faceData: user.faceData
    });
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newUser.name || !newUser.username || !newUser.email || !newUser.role) {
      toast({
        title: "Validation Error",
        description: "Name, username, email and role are required",
        variant: "destructive",
      });
      return;
    }
    if (newUser.role === "student" && (!newUser.departmentId || !newUser.year)) {
      toast({
        title: "Validation Error",
        description: "Department and year are required for students",
        variant: "destructive",
      });
      return;
    }
    updateUserMutation.mutate({
      id: selectedUser.id,
      user: newUser
    });
  };

  const handleDeleteUser = (id: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(id);
    }
  };

  // Department selection handlers
  const handleDepartmentSelect = (value: string) => {
    setNewUser({
      ...newUser,
      departmentId: parseInt(value)
    });
  };

  // Course handlers
  const handleDepartmentSelectForCourse = (value: string) => {
    setNewCourse({
      ...newCourse,
      departmentId: parseInt(value)
    });
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
              <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools.length}</div>
            <p className="text-xs text-muted-foreground">
              Schools in the system
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
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        {/* Schools Tab */}
        <TabsContent value="schools" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">School Management</h3>
            <Button onClick={() => setShowAddSchoolDialog(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add School
            </Button>
          </div>
          
          {isLoadingSchools ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : schools.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No schools</AlertTitle>
              <AlertDescription>
                No schools found. Add a school to start organizing your faculty.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>{school.description}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditSchool(school)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSchool(school.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          
          {/* Add School Dialog */}
          <Dialog open={showAddSchoolDialog} onOpenChange={setShowAddSchoolDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New School</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSchool} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newSchool.name}
                    onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                    placeholder="Enter school name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newSchool.description || ""}
                    onChange={(e) => setNewSchool({ ...newSchool, description: e.target.value })}
                    placeholder="Enter school description"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Add School</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Edit School Dialog */}
          <Dialog open={showEditSchoolDialog} onOpenChange={setShowEditSchoolDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit School</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateSchool} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={newSchool.name}
                    onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                    placeholder="Enter school name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={newSchool.description || ""}
                    onChange={(e) => setNewSchool({ ...newSchool, description: e.target.value })}
                    placeholder="Enter school description"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Update School</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditDepartment(dept)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteDepartment(dept.id)}
                            >
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
                    <Label htmlFor="dept-school">School *</Label>
                    <Select 
                      value={newDepartment.schoolId ? String(newDepartment.schoolId) : ""} 
                      onValueChange={(value) => setNewDepartment({
                        ...newDepartment, 
                        schoolId: parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={String(school.id)}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
          
          {/* Edit Department Dialog */}
          <Dialog open={showEditDepartmentDialog} onOpenChange={setShowEditDepartmentDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Department</DialogTitle>
                <DialogDescription>
                  Update department information.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleUpdateDepartment}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-dept-name">Department Name *</Label>
                    <Input
                      id="edit-dept-name"
                      placeholder="e.g., Computer Science"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-dept-school">School *</Label>
                    <Select 
                      value={newDepartment.schoolId ? String(newDepartment.schoolId) : ""} 
                      onValueChange={(value) => setNewDepartment({
                        ...newDepartment, 
                        schoolId: parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={String(school.id)}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-dept-desc">Description</Label>
                    <Input
                      id="edit-dept-desc"
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
                    onClick={() => setShowEditDepartmentDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateDepartmentMutation.isPending}
                  >
                    {updateDepartmentMutation.isPending ? "Updating..." : "Update Department"}
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
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditProgram(program)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteProgram(program.id)}
                              >
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
          
          {/* Edit Program Dialog */}
          <Dialog open={showEditProgramDialog} onOpenChange={setShowEditProgramDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Program</DialogTitle>
                <DialogDescription>
                  Update program information.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleUpdateProgram}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-program-name">Program Name *</Label>
                    <Input
                      id="edit-program-name"
                      placeholder="e.g., Bachelor of Computer Science"
                      value={newProgram.name}
                      onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-program-code">Program Code *</Label>
                    <Input
                      id="edit-program-code"
                      placeholder="e.g., BCS"
                      value={newProgram.code}
                      onChange={(e) => setNewProgram({...newProgram, code: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-program-dept">Department *</Label>
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
                    <Label htmlFor="edit-program-desc">Description</Label>
                    <Input
                      id="edit-program-desc"
                      placeholder="Brief description of the program"
                      value={newProgram.description || ""}
                      onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-program-duration">Duration (Years)</Label>
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
                    onClick={() => setShowEditProgramDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateProgramMutation.isPending}
                  >
                    {updateProgramMutation.isPending ? "Updating..." : "Update Program"}
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
            <Button onClick={() => setShowAddCourseDialog(true)}>
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
                        <TableCell>{departments.find(d => d.id === course.departmentId)?.name || "N/A"}</TableCell>
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteCourse(course.id)}
                            >
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

          {/* Add Course Dialog */}
          <Dialog open={showAddCourseDialog} onOpenChange={setShowAddCourseDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription>
                  Add a new course to the system. Fill in all required fields.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="course-code">Course Code *</Label>
                  <Input
                    id="course-code"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="course-name">Course Name *</Label>
                  <Input
                    id="course-name"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="course-department">Department *</Label>
                  <Select 
                    value={newCourse.departmentId ? String(newCourse.departmentId) : ""} 
                    onValueChange={handleDepartmentSelectForCourse}
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
                  <Label htmlFor="course-year">Year *</Label>
                  <Input
                    id="course-year"
                    type="number"
                    min={1}
                    max={6}
                    value={newCourse.year}
                    onChange={(e) => setNewCourse({ ...newCourse, year: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="course-schedule">Schedule</Label>
                  <Input
                    id="course-schedule"
                    value={newCourse.schedule || ""}
                    onChange={(e) => setNewCourse({ ...newCourse, schedule: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="course-active"
                    checked={newCourse.isActive ?? false}
                    onCheckedChange={(checked) => 
                      setNewCourse({ ...newCourse, isActive: checked === true })
                    }
                  />
                  <Label htmlFor="course-active">Active</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={handleAddCourse}>Add Course</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Course Dialog */}
          <Dialog open={showEditCourseDialog} onOpenChange={setShowEditCourseDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Course</DialogTitle>
                <DialogDescription>
                  Update course details. Fill in all required fields.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-course-code">Course Code *</Label>
                  <Input
                    id="edit-course-code"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-course-name">Course Name *</Label>
                  <Input
                    id="edit-course-name"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-course-department">Department *</Label>
                  <Select 
                    value={newCourse.departmentId ? String(newCourse.departmentId) : ""} 
                    onValueChange={handleDepartmentSelectForCourse}
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
                  <Label htmlFor="edit-course-year">Year *</Label>
                  <Input
                    id="edit-course-year"
                    type="number"
                    min={1}
                    max={6}
                    value={newCourse.year}
                    onChange={(e) => setNewCourse({ ...newCourse, year: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-course-schedule">Schedule</Label>
                  <Input
                    id="edit-course-schedule"
                    value={newCourse.schedule || ""}
                    onChange={(e) => setNewCourse({ ...newCourse, schedule: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-course-active"
                    checked={newCourse.isActive ?? false}
                    onCheckedChange={(checked) => 
                      setNewCourse({ ...newCourse, isActive: checked === true })
                    }
                  />
                  <Label htmlFor="edit-course-active">Active</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={handleUpdateCourse}>Update Course</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">User Management</h3>
            <Button onClick={() => setShowAddUserDialog(true)}>
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
                        <TableCell>{departments.find(d => d.id === user.departmentId)?.name || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
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

          {/* Add User Dialog */}
          <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user in the system.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddUser}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="user-name">Full Name *</Label>
                    <Input
                      id="user-name"
                      placeholder="e.g., John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="user-username">Username *</Label>
                    <Input
                      id="user-username"
                      placeholder="e.g., johndoe"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="user-email">Email *</Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="e.g., john@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="user-password">Password *</Label>
                    <Input
                      id="user-password"
                      type="password"
                      placeholder="Enter password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="user-role">Role *</Label>
                    <Select 
                      value={newUser.role} 
                      onValueChange={(value) => setNewUser({
                        ...newUser, 
                        role: value as "admin" | "lecturer" | "student"
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="lecturer">Lecturer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newUser.role === "student" && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="user-dept">Department *</Label>
                        <Select 
                          value={newUser.departmentId ? String(newUser.departmentId) : ""} 
                          onValueChange={(value) => setNewUser({
                            ...newUser, 
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
                        <Label htmlFor="user-year">Year *</Label>
                        <Select 
                          value={String(newUser.year)} 
                          onValueChange={(value) => setNewUser({
                            ...newUser, 
                            year: parseInt(value)
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Year 1</SelectItem>
                            <SelectItem value="2">Year 2</SelectItem>
                            <SelectItem value="3">Year 3</SelectItem>
                            <SelectItem value="4">Year 4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setShowAddUserDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addUserMutation.isPending}
                  >
                    {addUserMutation.isPending ? "Adding..." : "Add User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user information.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleUpdateUser}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-user-name">Full Name *</Label>
                    <Input
                      id="edit-user-name"
                      placeholder="e.g., John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-user-username">Username *</Label>
                    <Input
                      id="edit-user-username"
                      placeholder="e.g., johndoe"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-user-email">Email *</Label>
                    <Input
                      id="edit-user-email"
                      type="email"
                      placeholder="e.g., john@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-user-password">New Password</Label>
                    <Input
                      id="edit-user-password"
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={newUser.password || ""}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-user-role">Role *</Label>
                    <Select 
                      value={newUser.role} 
                      onValueChange={(value) => setNewUser({
                        ...newUser, 
                        role: value as "admin" | "lecturer" | "student"
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="lecturer">Lecturer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newUser.role === "student" && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-user-dept">Department *</Label>
                        <Select 
                          value={newUser.departmentId ? String(newUser.departmentId) : ""} 
                          onValueChange={(value) => setNewUser({
                            ...newUser, 
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
                        <Label htmlFor="edit-user-year">Year *</Label>
                        <Select 
                          value={String(newUser.year)} 
                          onValueChange={(value) => setNewUser({
                            ...newUser, 
                            year: parseInt(value)
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Year 1</SelectItem>
                            <SelectItem value="2">Year 2</SelectItem>
                            <SelectItem value="3">Year 3</SelectItem>
                            <SelectItem value="4">Year 4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setShowEditUserDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? "Updating..." : "Update User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}