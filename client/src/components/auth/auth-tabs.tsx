import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginSchema, insertUserSchema } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, Camera, Check, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MultiSelect } from '@/components/ui/multi-select';
import { loadModels, setupWebcam, stopWebcam, captureFaceData } from '@/lib/face-recognition';
import { apiRequest } from '@/lib/queryClient';

const loginFormSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['student', 'lecturer', 'admin']),
});

const registerFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, 'Confirm Password is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export function AuthTabs() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [faceVerificationStatus, setFaceVerificationStatus] = useState<'initial' | 'success' | 'error' | 'registering'>('initial');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { loginMutation, registerMutation } = useAuth();
  
  // Fetch departments for dropdown
  const { data: departments = [] } = useQuery<string[]>({
    queryKey: ['/api/departments'],
    staleTime: Infinity, // Departments won't change during a session
  });
  
  // Fetch all courses for potential enrollment
  const { data: allCourses = [] } = useQuery<any[]>({
    queryKey: ['/api/all-courses'],
    enabled: showFaceVerification, // Only fetch when we need to show courses
  });
  
  // Login form
  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: '',
      password: '',
      role: 'student',
    },
  });
  
  // Register form
  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: 'student',
      studentId: '',
      department: '',
      year: undefined,
      faceData: null,
    },
  });
  
  // Handle login submission
  function onLoginSubmit(values: z.infer<typeof loginFormSchema>) {
    loginMutation.mutate(values);
  }
  
  // Handle register submission
  function onRegisterSubmit(values: z.infer<typeof registerFormSchema>) {
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData, {
      onSuccess: (user) => {
        if (user.role === 'student') {
          setRegisteredUser(user);
          setShowFaceVerification(true);
        }
      }
    });
  }
  
  // Initialize face recognition
  useEffect(() => {
    if (showFaceVerification) {
      const initFaceRecognition = async () => {
        try {
          await loadModels();
          if (videoRef.current) {
            await setupWebcam(videoRef.current);
          }
        } catch (error) {
          console.error('Failed to initialize face recognition:', error);
          setFaceVerificationStatus('error');
        }
      };
      
      initFaceRecognition();
      
      return () => {
        if (videoRef.current) {
          stopWebcam(videoRef.current);
        }
      };
    }
  }, [showFaceVerification]);
  
  // Handle face capturing and registration
  async function captureAndRegisterFace() {
    if (!videoRef.current || !registeredUser) return;
    
    try {
      setFaceVerificationStatus('registering');
      const faceData = await captureFaceData(videoRef.current);
      
      // Save face data to server
      const response = await apiRequest('POST', '/api/face-data', {
        faceData
      });
      
      if (response.ok) {
        setFaceVerificationStatus('success');
        
        // Handle course enrollment if courses were selected
        if (selectedCourses.length > 0) {
          for (const courseId of selectedCourses) {
            await apiRequest('POST', '/api/student-courses', {
              courseId: parseInt(courseId)
            });
          }
        }
      } else {
        setFaceVerificationStatus('error');
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      setFaceVerificationStatus('error');
    }
  }
  
  // Close modal and reset
  function handleCloseVerification() {
    setShowFaceVerification(false);
    setFaceVerificationStatus('initial');
    setSelectedCourses([]);
    setRegisteredUser(null);
  }
  
  // Switch form based on role selection in register form
  const watchedRole = registerForm.watch('role');

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Logo and App Name */}
        <div className="p-6 bg-primary text-white text-center">
          <div className="flex justify-center items-center mb-2">
            <UserCheck className="h-6 w-6 mr-2" />
            <h1 className="text-2xl font-semibold">FaceAttend</h1>
          </div>
          <p className="text-sm opacity-80">Facial Recognition Attendance System</p>
        </div>
        
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login" className="py-3">Student/Lecturer Login</TabsTrigger>
            <TabsTrigger value="register" className="py-3">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="p-6">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="lecturer">Lecturer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username or Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username or email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="register" className="p-6">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="lecturer">Lecturer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {watchedRole === 'student' && (
                  <FormField
                    control={registerForm.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your student ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={registerForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {watchedRole === 'student' && (
                  <FormField
                    control={registerForm.control}
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
                              <SelectValue placeholder="Select your year" />
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
                )}
                
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Registering..." : "Register"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Only users connected to the school network can access this system.</p>
      </div>
      
      {/* Face Verification Dialog */}
      <Dialog open={showFaceVerification} onOpenChange={setShowFaceVerification}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Face Verification</DialogTitle>
            <DialogDescription>
              {faceVerificationStatus === 'initial' && "Please complete face verification to enable attendance marking."}
              {faceVerificationStatus === 'success' && "Face verification successful! You can now mark attendance using face recognition."}
              {faceVerificationStatus === 'error' && "Face verification failed. Please try again."}
              {faceVerificationStatus === 'registering' && "Processing... Please wait."}
            </DialogDescription>
          </DialogHeader>
          
          {faceVerificationStatus === 'initial' && (
            <div className="flex flex-col space-y-4">
              <div className="relative bg-muted rounded-md overflow-hidden w-full h-64 mx-auto">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full w-52 h-52 border-2 border-dashed border-primary opacity-70" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Select courses to enroll in (optional):</h3>
                <MultiSelect
                  options={allCourses.map((course: any) => ({
                    label: `${course.code}: ${course.name}`,
                    value: course.id.toString()
                  }))}
                  selected={selectedCourses}
                  onChange={setSelectedCourses}
                  placeholder="Select courses..."
                />
              </div>
              
              <Button 
                onClick={captureAndRegisterFace}
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" /> Capture and Register Face
              </Button>
            </div>
          )}
          
          {faceVerificationStatus === 'success' && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-center">Your face has been registered successfully.</p>
              <Button 
                className="mt-4" 
                onClick={handleCloseVerification}
              >
                Continue to Dashboard
              </Button>
            </div>
          )}
          
          {faceVerificationStatus === 'error' && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-center">There was an error registering your face. Please try again.</p>
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleCloseVerification}
                >
                  Skip for now
                </Button>
                <Button 
                  onClick={() => setFaceVerificationStatus('initial')}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {faceVerificationStatus === 'registering' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p>Processing face data...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
