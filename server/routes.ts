import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { schoolNetworkOnly } from "./network";
import { ZodError } from "zod";
import { 
  insertCourseSchema, 
  activateCourseSchema, 
  insertStudentCourseSchema, 
  insertAttendanceSchema,
  insertDepartmentSchema,
  insertProgramSchema,
  insertUserSchema,
  insertSchoolSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcrypt";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Apply school network middleware to all routes
  app.use(schoolNetworkOnly);
  
  // School management routes
  app.get("/api/schools", async (req, res) => {
    try {
      const schools = await storage.getSchools();
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ error: "Failed to fetch schools" });
    }
  });

  app.post("/api/schools", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const schoolData = insertSchoolSchema.parse(req.body);
      const school = await storage.createSchool(schoolData);
      res.status(201).json(school);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create school" });
    }
  });

  app.put("/api/schools/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { id } = req.params;
      const schoolData = insertSchoolSchema.parse(req.body);
      const school = await storage.updateSchool(parseInt(id), schoolData);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json(school);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update school" });
    }
  });

  app.delete("/api/schools/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { id } = req.params;
      const success = await storage.deleteSchool(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "School not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete school" });
    }
  });

  // Get departments for a specific school
  app.get("/api/schools/:schoolId/departments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { schoolId } = req.params;
    const departments = await storage.getDepartmentsBySchool(parseInt(schoolId));
    return res.json(departments);
  });
  
  // Get departments for registration and course creation
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });
  
  app.post("/api/departments", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.put("/api/departments/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { id } = req.params;
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.updateDepartment(parseInt(id), departmentData);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { id } = req.params;
      const success = await storage.deleteDepartment(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // Get courses for a specific department
  app.get("/api/departments/:departmentId/courses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { departmentId } = req.params;
    const courses = await storage.getCoursesByDepartment(parseInt(departmentId));
    return res.json(courses);
  });

  // Get all courses (for enrollment)
  app.get("/api/all-courses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const courses = await storage.getAllCourses();
    return res.json(courses);
  });
  
  // Course management routes
  app.get("/api/courses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (req.user.role === "lecturer") {
      // Lecturers see only their own courses
      const courses = await storage.getCoursesByLecturer(req.user.id);
      return res.json(courses);
    } else {
      // For students, we need to filter by:
      // 1. Courses they're enrolled in (from student_courses table)
      // 2. Courses in their department and year
      
      // Get the student's details first
      const student = await storage.getUser(req.user.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if student has completed face verification
      if (!student.faceData) {
        return res.status(403).json({ 
          message: "Face verification required", 
          requiresFaceRegistration: true 
        });
      }
      
      // Get courses the student is enrolled in
      const enrolledCourses = await storage.getStudentCourses(req.user.id);
      
      // Get all courses to filter
      const allCourses = await storage.getAllCourses();
      
      // Filter courses by enrollment OR (department AND year)
      const enrolledCourseIds = enrolledCourses.map(course => course.id);
      const relevantCourses = allCourses.filter(course => 
        enrolledCourseIds.includes(course.id) || 
        (course.departmentId === student.departmentId && course.year === student.year)
      );
      
      return res.json(relevantCourses);
    }
  });
  
  app.post("/api/courses", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "lecturer") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const courseData = insertCourseSchema.parse({
        ...req.body,
        lecturerId: req.user.id,
        isActive: false,
        activatedAt: null
      });
      
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });
  
  app.post("/api/courses/:id/activate", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "lecturer") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const { id } = req.params;
      const { isActive } = activateCourseSchema.parse({
        courseId: parseInt(id),
        isActive: req.body.isActive
      });
      
      const course = await storage.getCourse(parseInt(id));
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.lecturerId !== req.user.id) {
        return res.status(403).json({ message: "You are not authorized to modify this course" });
      }
      
      const updatedCourse = await storage.updateCourseStatus(parseInt(id), isActive);
      res.json(updatedCourse);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update course status" });
    }
  });
  
  app.get("/api/active-courses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const activeCourses = await storage.getActiveCourses();
    
    if (req.user.role === "student") {
      // For students, filter by:
      // 1. Courses they're enrolled in (from student_courses table)
      // 2. Their department
      // 3. Their year
      
      // Get the student's details first
      const student = await storage.getUser(req.user.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if student has completed face verification
      if (!student.faceData) {
        return res.status(403).json({ 
          message: "Face verification required", 
          requiresFaceRegistration: true 
        });
      }
      
      // Get courses the student is enrolled in
      const studentCourses = await storage.getStudentCourses(req.user.id);
      const enrolledCourseIds = studentCourses.map(course => course.id);
      
      // Filter active courses by enrollment, department, and year
      const filteredCourses = activeCourses.filter(course => 
        // Either enrolled in the course OR matches student's department and year
        enrolledCourseIds.includes(course.id) || 
        (course.departmentId === student.departmentId && course.year === student.year)
      );
      
      return res.json(filteredCourses);
    }
    
    // For lecturers, return all active courses
    res.json(activeCourses);
  });
  
  // Enroll student in course
  app.post("/api/student-courses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      let studentId = req.user.id;
      
      // If lecturer is adding a student, allow specifying studentId
      if (req.user.role === "lecturer" && req.body.studentId) {
        studentId = req.body.studentId;
      } else if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const courseId = req.body.courseId;
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const studentCourse = await storage.addStudentToCourse({
        studentId,
        courseId
      });
      
      res.status(201).json(studentCourse);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to enroll student in course" });
    }
  });
  
  // Face recognition data management
  app.post("/api/face-data", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { faceData } = req.body;
      
      if (!faceData) {
        return res.status(400).json({ message: "Face data is required" });
      }
      
      const updatedUser = await storage.updateUserFaceData(req.user.id, faceData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error saving face data:", error);
      res.status(500).json({ message: "Failed to save face data" });
    }
  });
  
  // Attendance routes
  app.post("/api/attendance", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      // Check if student has completed face verification
      const student = await storage.getUser(req.user.id);
      if (!student || !student.faceData) {
        return res.status(403).json({ 
          message: "Face verification is required before marking attendance",
          requiresFaceRegistration: true
        });
      }
      
      const { courseId, status } = insertAttendanceSchema.parse({
        ...req.body,
        studentId: req.user.id,
        status: "present"
      });
      
      // Verify the course is active
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (!course.isActive) {
        return res.status(400).json({ message: "Course is not currently active" });
      }
      
      // Verify student is enrolled in this course
      const studentCourses = await storage.getStudentCourses(req.user.id);
      const isEnrolled = studentCourses.some(c => c.id === courseId);
      
      if (!isEnrolled && (course.departmentId !== student.departmentId || course.year !== student.year)) {
        return res.status(403).json({ 
          message: "You are not enrolled in this course and it's not in your department/year" 
        });
      }
      
      // Check if attendance has already been marked today
      const today = new Date();
      const todayAttendance = await storage.getAttendanceByCourseAndDate(courseId, today);
      const alreadyMarked = todayAttendance.some(a => a.studentId === req.user.id);
      
      if (alreadyMarked) {
        return res.status(400).json({ message: "Attendance already marked for today" });
      }
      
      // Mark attendance
      const attendance = await storage.markAttendance({
        studentId: req.user.id,
        courseId,
        status
      });
      
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to mark attendance" });
    }
  });
  
  app.get("/api/attendance/student", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const studentId = req.user.role === "student" ? req.user.id : parseInt(req.query.studentId as string);
    
    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }
    
    if (req.user.role === "student" && req.user.id !== studentId) {
      return res.status(403).json({ message: "You can only view your own attendance" });
    }
    
    const attendance = await storage.getAttendanceByStudent(studentId);
    res.json(attendance);
  });
  
  app.get("/api/attendance/course/:courseId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Validate access permissions
    if (req.user.role === "lecturer" && course.lecturerId !== req.user.id) {
      return res.status(403).json({ message: "You don't have access to this course" });
    } else if (req.user.role === "student") {
      // Students can only see their course attendance
      const studentCourses = await storage.getStudentCourses(req.user.id);
      const isEnrolled = studentCourses.some(c => c.id === courseId);
      
      if (!isEnrolled) {
        return res.status(403).json({ message: "You are not enrolled in this course" });
      }
    }
    
    let attendance;
    if (req.user.role === "student") {
      // Students only see their own attendance
      attendance = await storage.getAttendanceByStudentAndCourse(req.user.id, courseId);
    } else {
      // Lecturers see all attendance for their courses
      attendance = await storage.getAttendanceByCourse(courseId);
    }
    
    res.json(attendance);
  });
  
  app.get("/api/attendance/course/:courseId/today", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "lecturer") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    if (course.lecturerId !== req.user.id) {
      return res.status(403).json({ message: "You don't have access to this course" });
    }
    
    const today = new Date();
    const attendance = await storage.getAttendanceByCourseAndDate(courseId, today);
    res.json(attendance);
  });

  // Program management routes
  app.get("/api/programs", async (req, res) => {
    try {
      const programs = await storage.getAllPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });

  app.post("/api/programs", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const programData = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(programData);
      res.status(201).json(program);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create program" });
    }
  });

  app.put("/api/programs/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { id } = req.params;
      const programData = insertProgramSchema.parse(req.body);
      const program = await storage.updateProgram(parseInt(id), programData);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      res.json(program);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update program" });
    }
  });

  app.delete("/api/programs/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { id } = req.params;
      const success = await storage.deleteProgram(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Program not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete program" });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const users = await storage.getAllUsers();
    return res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { id } = req.params;
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.updateUser(parseInt(id), userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { id } = req.params;
      const success = await storage.deleteUser(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // User registration
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Validate required fields based on role
      if (userData.role === "student") {
        if (!userData.schoolId || !userData.departmentId || !userData.programId || !userData.year) {
          return res.status(400).json({ error: "Missing required fields for student registration" });
        }
        
        // Check if school exists
        const school = await storage.getSchool(userData.schoolId);
        if (!school) {
          return res.status(400).json({ error: "Invalid school" });
        }
        
        // Check if department exists and belongs to the school
        const department = await storage.getDepartment(userData.departmentId);
        if (!department || department.schoolId !== userData.schoolId) {
          return res.status(400).json({ error: "Invalid department" });
        }
        
        // Check if program exists and belongs to the department
        const program = await storage.getProgram(userData.programId);
        if (!program || program.departmentId !== userData.departmentId) {
          return res.status(400).json({ error: "Invalid program" });
        }
      }
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsernameOrEmail(userData.username, userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Username or email already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
