import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// School table to manage available schools
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Department table to manage available departments
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  schoolId: integer("school_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Programs table to represent academic programs
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  departmentId: integer("department_id").notNull(),
  description: text("description"),
  durationYears: integer("duration_years").notNull().default(4),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["student", "lecturer", "admin"] }).notNull(),
  studentId: text("student_id").notNull().default(""),
  schoolId: integer("school_id"),
  departmentId: integer("department_id"),
  year: integer("year"),
  faceData: text("face_data"),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  schoolId: integer("school_id").notNull(),
  departmentId: integer("department_id").notNull(),
  programId: integer("program_id").notNull(),
  year: integer("year").notNull(),
  lecturerId: integer("lecturer_id").notNull(),
  schedule: text("schedule"),
  isActive: boolean("is_active").default(false),
  activatedAt: timestamp("activated_at"),
});

export const studentCourses = pgTable("student_courses", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
});

export const programCourses = pgTable("program_courses", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull(),
  courseId: integer("course_id").notNull(),
  yearLevel: integer("year_level").notNull(),
  semester: integer("semester").notNull(),
  isRequired: boolean("is_required").notNull().default(true),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status", { enum: ["present", "absent"] }).notNull(),
});

// Insert schemas
export const insertSchoolSchema = createInsertSchema(schools).pick({
  name: true,
  description: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  schoolId: true,
  description: true,
});

export const insertProgramSchema = createInsertSchema(programs).pick({
  name: true,
  code: true,
  departmentId: true,
  description: true,
  durationYears: true,
});

export const insertUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "lecturer", "admin"]),
  studentId: z.string().optional(),
  schoolId: z.number().optional(),
  departmentId: z.number().optional(),
  programId: z.number().optional(),
  year: z.number().min(1).max(4).optional(),
  faceData: z.string().nullable(),
});

export const insertCourseSchema = z.object({
  code: z.string().min(1, "Course code is required"),
  name: z.string().min(1, "Course name is required"),
  schoolId: z.number().min(1, "School is required"),
  departmentId: z.number().min(1, "Department is required"),
  programId: z.number().min(1, "Program is required"),
  year: z.number().min(1, "Year is required"),
  lecturerId: z.number().min(1, "Lecturer is required"),
  schedule: z.string().optional(),
  isActive: z.boolean().default(false),
  activatedAt: z.date().nullable()
});

export const insertStudentCourseSchema = createInsertSchema(studentCourses).pick({
  studentId: true,
  courseId: true,
});

export const insertProgramCourseSchema = createInsertSchema(programCourses).pick({
  programId: true,
  courseId: true,
  yearLevel: true,
  semester: true,
  isRequired: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  studentId: true,
  courseId: true,
  status: true,
});

// Login schema
export const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["student", "lecturer", "admin"]),
});

// Activate course schema
export const activateCourseSchema = z.object({
  courseId: z.number(),
  isActive: z.boolean(),
});

// Types
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertStudentCourse = z.infer<typeof insertStudentCourseSchema>;
export type StudentCourse = typeof studentCourses.$inferSelect;

export type InsertProgramCourse = z.infer<typeof insertProgramCourseSchema>;
export type ProgramCourse = typeof programCourses.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type LoginData = z.infer<typeof loginSchema>;
export type ActivateCourseData = z.infer<typeof activateCourseSchema>;
