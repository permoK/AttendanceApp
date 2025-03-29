import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  studentCourses, type StudentCourse, type InsertStudentCourse,
  attendance, type Attendance, type InsertAttendance
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserFaceData(userId: number, faceData: string): Promise<User | undefined>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByLecturer(lecturerId: number): Promise<Course[]>;
  getActiveCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourseStatus(id: number, isActive: boolean): Promise<Course | undefined>;
  
  // Student Course operations
  getStudentCourses(studentId: number): Promise<Course[]>;
  addStudentToCourse(studentCourse: InsertStudentCourse): Promise<StudentCourse>;
  
  // Attendance operations
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceByStudentAndCourse(studentId: number, courseId: number): Promise<Attendance[]>;
  getAttendanceByCourse(courseId: number): Promise<Attendance[]>;
  getAttendanceByCourseAndDate(courseId: number, date: Date): Promise<Attendance[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private studentCourses: Map<number, StudentCourse>;
  private attendanceRecords: Map<number, Attendance>;
  
  sessionStore: session.SessionStore;
  
  private userId: number;
  private courseId: number;
  private studentCourseId: number;
  private attendanceId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.studentCourses = new Map();
    this.attendanceRecords = new Map();
    
    this.userId = 1;
    this.courseId = 1;
    this.studentCourseId = 1;
    this.attendanceId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Add some demo data
    this.seedDemoData();
  }

  private seedDemoData() {
    // Add a lecturer
    this.createUser({
      username: "lecturer",
      password: "$2b$10$hACwQ5/HsfBGJhbx3ypR8.bEoCB7v.5wX4VTp/P.JWsBXQz1cHdLm", // "password"
      name: "Dr. Sarah Johnson",
      role: "lecturer",
      studentId: "",
      department: "Computer Science",
      year: null,
      faceData: null
    });
    
    // Add a student
    this.createUser({
      username: "student",
      password: "$2b$10$hACwQ5/HsfBGJhbx3ypR8.bEoCB7v.5wX4VTp/P.JWsBXQz1cHdLm", // "password"
      name: "John Smith",
      role: "student",
      studentId: "ST12345",
      department: "Computer Science",
      year: 3,
      faceData: null
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserFaceData(userId: number, faceData: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, faceData };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCoursesByLecturer(lecturerId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.lecturerId === lecturerId);
  }

  async getActiveCourses(): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.isActive);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseId++;
    const course: Course = { ...insertCourse, id };
    this.courses.set(id, course);
    return course;
  }

  async updateCourseStatus(id: number, isActive: boolean): Promise<Course | undefined> {
    const course = await this.getCourse(id);
    if (!course) return undefined;
    
    const updatedCourse = { 
      ...course, 
      isActive, 
      activatedAt: isActive ? new Date() : null 
    };
    
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async getStudentCourses(studentId: number): Promise<Course[]> {
    const studentCourseEntries = Array.from(this.studentCourses.values())
      .filter(sc => sc.studentId === studentId);
    
    const courseIds = studentCourseEntries.map(sc => sc.courseId);
    return Array.from(this.courses.values())
      .filter(course => courseIds.includes(course.id));
  }

  async addStudentToCourse(insertStudentCourse: InsertStudentCourse): Promise<StudentCourse> {
    const id = this.studentCourseId++;
    const studentCourse: StudentCourse = { ...insertStudentCourse, id };
    this.studentCourses.set(id, studentCourse);
    return studentCourse;
  }

  async markAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceId++;
    const timestamp = new Date();
    const attendance: Attendance = { ...insertAttendance, id, timestamp };
    this.attendanceRecords.set(id, attendance);
    return attendance;
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return Array.from(this.attendanceRecords.values())
      .filter(record => record.studentId === studentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAttendanceByStudentAndCourse(studentId: number, courseId: number): Promise<Attendance[]> {
    return Array.from(this.attendanceRecords.values())
      .filter(record => record.studentId === studentId && record.courseId === courseId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAttendanceByCourse(courseId: number): Promise<Attendance[]> {
    return Array.from(this.attendanceRecords.values())
      .filter(record => record.courseId === courseId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAttendanceByCourseAndDate(courseId: number, date: Date): Promise<Attendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.attendanceRecords.values())
      .filter(record => 
        record.courseId === courseId && 
        record.timestamp >= startOfDay && 
        record.timestamp <= endOfDay
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();
