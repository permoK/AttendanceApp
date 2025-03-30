import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  studentCourses, type StudentCourse, type InsertStudentCourse,
  attendance, type Attendance, type InsertAttendance
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, between, desc, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const PostgresSessionStore = connectPg(session);

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
  getAllCourses(): Promise<Course[]>;
  getDepartments(): Promise<string[]>;
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
  sessionStore: session.Store;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
    
    // Seed demo data if not already seeded
    this.seedDataIfNeeded();
  }

  private async seedDataIfNeeded() {
    // Check if users table exists and has data
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) return;
    
    console.log('Seeding initial data...');
    
    // Add lecturers
    const hashedPassword = await hashPassword('password');
    
    // Add admin user
    const [admin] = await db.insert(users).values({
      username: "admin",
      email: "admin@university.edu",
      password: hashedPassword,
      name: "System Administrator",
      role: "admin",
      studentId: "",
      department: null,
      year: null,
      faceData: null
    }).returning();
    
    const [lecturer1] = await db.insert(users).values({
      username: "lecturer",
      email: "sarah.johnson@university.edu",
      password: hashedPassword,
      name: "Dr. Sarah Johnson",
      role: "lecturer",
      studentId: "",
      department: "Computer Science",
      year: null,
      faceData: null
    }).returning();
    
    const [lecturer2] = await db.insert(users).values({
      username: "profsmith",
      email: "john.smith@university.edu",
      password: hashedPassword,
      name: "Prof. John Smith",
      role: "lecturer",
      studentId: "",
      department: "Electrical Engineering",
      year: null,
      faceData: null
    }).returning();
    
    // Add students
    const [student1] = await db.insert(users).values({
      username: "student",
      email: "john.s@university.edu",
      password: hashedPassword,
      name: "John Smith",
      role: "student",
      studentId: "ST12345",
      department: "Computer Science",
      year: 3,
      faceData: null
    }).returning();
    
    const [student2] = await db.insert(users).values({
      username: "alice",
      email: "alice.j@university.edu",
      password: hashedPassword,
      name: "Alice Johnson",
      role: "student",
      studentId: "ST12346",
      department: "Computer Science",
      year: 2,
      faceData: null
    }).returning();
    
    const [student3] = await db.insert(users).values({
      username: "bob",
      email: "bob.w@university.edu",
      password: hashedPassword,
      name: "Bob Williams",
      role: "student",
      studentId: "ST12347",
      department: "Electrical Engineering",
      year: 3,
      faceData: null
    }).returning();
    
    // Add courses
    const [course1] = await db.insert(courses).values({
      code: "CS101",
      name: "Introduction to Computer Science",
      department: "Computer Science",
      year: 1,
      lecturerId: lecturer1.id,
      schedule: "MWF 10:00 AM - 11:30 AM",
      isActive: false,
      activatedAt: null
    }).returning();
    
    const [course2] = await db.insert(courses).values({
      code: "CS301",
      name: "Database Systems",
      department: "Computer Science",
      year: 3,
      lecturerId: lecturer1.id,
      schedule: "TTh 1:00 PM - 2:30 PM",
      isActive: false,
      activatedAt: null
    }).returning();
    
    const [course3] = await db.insert(courses).values({
      code: "EE202",
      name: "Circuit Analysis",
      department: "Electrical Engineering",
      year: 2,
      lecturerId: lecturer2.id,
      schedule: "MWF 2:00 PM - 3:30 PM",
      isActive: false,
      activatedAt: null
    }).returning();
    
    // Enroll students in courses
    await db.insert(studentCourses).values({
      studentId: student1.id,
      courseId: course1.id
    });
    
    await db.insert(studentCourses).values({
      studentId: student1.id,
      courseId: course2.id
    });
    
    await db.insert(studentCourses).values({
      studentId: student2.id,
      courseId: course1.id
    });
    
    await db.insert(studentCourses).values({
      studentId: student3.id,
      courseId: course3.id
    });
    
    console.log('Demo data seeded successfully');
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUserFaceData(userId: number, faceData: string): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ faceData })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByLecturer(lecturerId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.lecturerId, lecturerId));
  }

  async getActiveCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true));
  }
  
  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }
  
  async getDepartments(): Promise<string[]> {
    // Get unique departments from courses
    const result = await db.select({ department: courses.department })
      .from(courses)
      .groupBy(courses.department);
    
    // Get unique departments from users
    const userDepts = await db.select({ department: users.department })
      .from(users)
      .where(sql`${users.department} IS NOT NULL`)
      .groupBy(users.department);
    
    // Combine and deduplicate
    const departments = new Set<string>([
      ...result.map(r => r.department), 
      ...userDepts.map(u => u.department).filter(Boolean)
    ] as string[]);
    
    // Default departments if none found
    if (departments.size === 0) {
      return ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Business Administration"];
    }
    
    return Array.from(departments);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async updateCourseStatus(id: number, isActive: boolean): Promise<Course | undefined> {
    const [updatedCourse] = await db.update(courses)
      .set({ 
        isActive, 
        activatedAt: isActive ? new Date() : null
      })
      .where(eq(courses.id, id))
      .returning();
    
    return updatedCourse;
  }

  async getStudentCourses(studentId: number): Promise<Course[]> {
    // Join studentCourses with courses to get all courses the student is enrolled in
    return await db.select({
      id: courses.id,
      code: courses.code,
      name: courses.name,
      department: courses.department,
      year: courses.year,
      lecturerId: courses.lecturerId,
      schedule: courses.schedule,
      isActive: courses.isActive,
      activatedAt: courses.activatedAt
    })
    .from(studentCourses)
    .innerJoin(courses, eq(studentCourses.courseId, courses.id))
    .where(eq(studentCourses.studentId, studentId));
  }

  async addStudentToCourse(insertStudentCourse: InsertStudentCourse): Promise<StudentCourse> {
    const [studentCourse] = await db.insert(studentCourses)
      .values(insertStudentCourse)
      .returning();
    
    return studentCourse;
  }

  async markAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [attendance] = await db.insert(attendance)
      .values(insertAttendance)
      .returning();
    
    return attendance;
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return await db.select()
      .from(attendance)
      .where(eq(attendance.studentId, studentId))
      .orderBy(desc(attendance.timestamp));
  }

  async getAttendanceByStudentAndCourse(studentId: number, courseId: number): Promise<Attendance[]> {
    return await db.select()
      .from(attendance)
      .where(and(
        eq(attendance.studentId, studentId),
        eq(attendance.courseId, courseId)
      ))
      .orderBy(desc(attendance.timestamp));
  }

  async getAttendanceByCourse(courseId: number): Promise<Attendance[]> {
    return await db.select()
      .from(attendance)
      .where(eq(attendance.courseId, courseId))
      .orderBy(desc(attendance.timestamp));
  }

  async getAttendanceByCourseAndDate(courseId: number, date: Date): Promise<Attendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.select()
      .from(attendance)
      .where(and(
        eq(attendance.courseId, courseId),
        between(attendance.timestamp, startOfDay, endOfDay)
      ))
      .orderBy(desc(attendance.timestamp));
  }
}

export const storage = new DatabaseStorage();
