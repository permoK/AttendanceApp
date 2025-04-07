import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  studentCourses, type StudentCourse, type InsertStudentCourse,
  attendance as attendanceTable, type Attendance, type InsertAttendance,
  departments, type Department, type InsertDepartment,
  programs, type Program, type InsertProgram,
  schools, type School, type InsertSchool
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, between, desc, sql, or } from "drizzle-orm";
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
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  updateUserFaceData(userId: number, faceData: string): Promise<User | undefined>;
  
  // School operations
  getSchools(): Promise<School[]>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: number, school: InsertSchool): Promise<School | undefined>;
  deleteSchool(id: number): Promise<boolean>;
  
  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartmentsBySchool(schoolId: number): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: InsertDepartment): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  
  // Program operations
  getAllPrograms(): Promise<Program[]>;
  getProgramsByDepartment(departmentId: number): Promise<Program[]>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, program: InsertProgram): Promise<Program | undefined>;
  deleteProgram(id: number): Promise<boolean>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByDepartment(departmentId: number): Promise<Course[]>;
  getCoursesByLecturer(lecturerId: number): Promise<Course[]>;
  getActiveCourses(): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
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
    
    // Add schools
    const [school1] = await db.insert(schools).values({
      name: "School of Computing",
      description: "School of Computing and Information Technology"
    }).returning();

    const [school2] = await db.insert(schools).values({
      name: "School of Engineering",
      description: "School of Engineering and Technology"
    }).returning();

    // Add departments
    const [dept1] = await db.insert(departments).values({
      name: "Computer Science",
      schoolId: school1.id,
      description: "Department of Computer Science"
    }).returning();

    const [dept2] = await db.insert(departments).values({
      name: "Electrical Engineering",
      schoolId: school2.id,
      description: "Department of Electrical Engineering"
    }).returning();
    
    // Add programs
    const [program1] = await db.insert(programs).values({
      name: "Computer Science",
      departmentId: dept1.id,
      description: "Program in Computer Science"
    }).returning();

    const [program2] = await db.insert(programs).values({
      name: "Electrical Engineering",
      departmentId: dept2.id,
      description: "Program in Electrical Engineering"
    }).returning();
    
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
      schoolId: school1.id,
      departmentId: dept1.id,
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
      schoolId: school1.id,
      departmentId: dept1.id,
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
      schoolId: school2.id,
      departmentId: dept2.id,
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
      schoolId: school1.id,
      departmentId: dept1.id,
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
      schoolId: school1.id,
      departmentId: dept1.id,
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
      schoolId: school2.id,
      departmentId: dept2.id,
      year: 3,
      faceData: null
    }).returning();
    
    // Add courses
    const [course1] = await db.insert(courses).values({
      code: "CS101",
      name: "Introduction to Computer Science",
      schoolId: school1.id,
      departmentId: dept1.id,
      programId: program1.id,
      year: 1,
      lecturerId: lecturer1.id,
      schedule: "MWF 10:00 AM - 11:30 AM",
      isActive: false,
      activatedAt: null
    }).returning();
    
    const [course2] = await db.insert(courses).values({
      code: "CS301",
      name: "Database Systems",
      schoolId: school1.id,
      departmentId: dept1.id,
      programId: program1.id,
      year: 3,
      lecturerId: lecturer1.id,
      schedule: "TTh 1:00 PM - 2:30 PM",
      isActive: false,
      activatedAt: null
    }).returning();
    
    const [course3] = await db.insert(courses).values({
      code: "EE202",
      name: "Circuit Analysis",
      schoolId: school2.id,
      departmentId: dept2.id,
      programId: program2.id,
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
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
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
    return await db
      .select({
        id: courses.id,
        code: courses.code,
        name: courses.name,
        schoolId: courses.schoolId,
        departmentId: courses.departmentId,
        programId: courses.programId,
        year: courses.year,
        lecturerId: courses.lecturerId,
        schedule: courses.schedule,
        isActive: courses.isActive,
        activatedAt: courses.activatedAt,
        department: departments.name
      })
      .from(courses)
      .leftJoin(departments, eq(courses.departmentId, departments.id))
      .where(eq(courses.lecturerId, lecturerId));
  }

  async getActiveCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true));
  }
  
  async getAllCourses(): Promise<Course[]> {
    return await db
      .select({
        id: courses.id,
        code: courses.code,
        name: courses.name,
        schoolId: courses.schoolId,
        departmentId: courses.departmentId,
        programId: courses.programId,
        year: courses.year,
        lecturerId: courses.lecturerId,
        schedule: courses.schedule,
        isActive: courses.isActive,
        activatedAt: courses.activatedAt,
        department: departments.name
      })
      .from(courses)
      .leftJoin(departments, eq(courses.departmentId, departments.id));
  }
  
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartmentsBySchool(schoolId: number): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.schoolId, schoolId));
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async updateDepartment(id: number, department: InsertDepartment): Promise<Department | undefined> {
    const [updatedDepartment] = await db.update(departments)
      .set(department)
      .where(eq(departments.id, id))
      .returning();
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const [deletedDepartment] = await db.delete(departments)
      .where(eq(departments.id, id))
      .returning();
    return !!deletedDepartment;
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
      departmentId: courses.departmentId,
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
    const [attendanceRecord] = await db.insert(attendanceTable)
      .values(insertAttendance)
      .returning();
    
    return attendanceRecord;
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.studentId, studentId))
      .orderBy(desc(attendanceTable.timestamp));
  }

  async getAttendanceByStudentAndCourse(studentId: number, courseId: number): Promise<Attendance[]> {
    return await db.select()
      .from(attendanceTable)
      .where(and(
        eq(attendanceTable.studentId, studentId),
        eq(attendanceTable.courseId, courseId)
      ))
      .orderBy(desc(attendanceTable.timestamp));
  }

  async getAttendanceByCourse(courseId: number): Promise<Attendance[]> {
    return await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.courseId, courseId))
      .orderBy(desc(attendanceTable.timestamp));
  }

  async getAttendanceByCourseAndDate(courseId: number, date: Date): Promise<Attendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.select()
      .from(attendanceTable)
      .where(and(
        eq(attendanceTable.courseId, courseId),
        between(attendanceTable.timestamp, startOfDay, endOfDay)
      ))
      .orderBy(desc(attendanceTable.timestamp));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    // If password is included in the update, hash it first
    if (user.password) {
      user.password = await hashPassword(user.password);
    }
    
    const [updatedUser] = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deletedUser] = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!deletedUser;
  }

  async getAllPrograms(): Promise<Program[]> {
    return await db.select().from(programs);
  }

  async getProgramsByDepartment(departmentId: number): Promise<Program[]> {
    return await db.select().from(programs).where(eq(programs.departmentId, departmentId));
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [newProgram] = await db.insert(programs).values(program).returning();
    return newProgram;
  }

  async updateProgram(id: number, program: InsertProgram): Promise<Program | undefined> {
    const [updatedProgram] = await db.update(programs)
      .set(program)
      .where(eq(programs.id, id))
      .returning();
    return updatedProgram;
  }

  async deleteProgram(id: number): Promise<boolean> {
    const result = await db
      .delete(programs)
      .where(eq(programs.id, id))
      .returning();
    return result.length > 0;
  }

  // School methods
  async getSchools(): Promise<School[]> {
    return db.select().from(schools);
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db.insert(schools).values(school).returning();
    return newSchool;
  }

  async updateSchool(id: number, school: InsertSchool): Promise<School | undefined> {
    const [updatedSchool] = await db.update(schools)
      .set(school)
      .where(eq(schools.id, id))
      .returning();
    return updatedSchool;
  }

  async deleteSchool(id: number): Promise<boolean> {
    const [deletedSchool] = await db.delete(schools)
      .where(eq(schools.id, id))
      .returning();
    return !!deletedSchool;
  }

  // Course methods
  async getCoursesByDepartment(departmentId: number): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.departmentId, departmentId));
  }

  async getUserByUsernameOrEmail(username: string, email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, username),
          eq(users.email, email)
        )
      );
    return result[0] || null;
  }

  async getSchool(id: number): Promise<School | null> {
    const result = await db.select().from(schools).where(eq(schools.id, id));
    return result[0] || null;
  }

  async getDepartment(id: number): Promise<Department | null> {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    return result[0] || null;
  }

  async getProgram(id: number): Promise<Program | null> {
    const result = await db.select().from(programs).where(eq(programs.id, id));
    return result[0] || null;
  }
}

export const storage = new DatabaseStorage();
