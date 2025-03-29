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
  insertAttendanceSchema 
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Apply school network middleware to all routes
  app.use(schoolNetworkOnly);
  
  // Course management routes
  app.get("/api/courses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (req.user.role === "lecturer") {
      const courses = await storage.getCoursesByLecturer(req.user.id);
      return res.json(courses);
    } else {
      const courses = await storage.getStudentCourses(req.user.id);
      return res.json(courses);
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
      // For students, only return courses they are enrolled in
      const studentCourses = await storage.getStudentCourses(req.user.id);
      const studentCourseIds = studentCourses.map(course => course.id);
      
      const activeStudentCourses = activeCourses.filter(course => 
        studentCourseIds.includes(course.id)
      );
      
      return res.json(activeStudentCourses);
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
  
  // Attendance routes
  app.post("/api/attendance", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
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
      
      if (!isEnrolled) {
        return res.status(403).json({ message: "You are not enrolled in this course" });
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

  const httpServer = createServer(app);
  return httpServer;
}
