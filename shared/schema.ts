import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["student", "lecturer"] }).notNull(),
  studentId: text("student_id").notNull().default(""),
  department: text("department"),
  year: integer("year"),
  faceData: text("face_data"),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  department: text("department").notNull(),
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

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status", { enum: ["present", "absent"] }).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  studentId: true,
  department: true,
  year: true,
  faceData: true,
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  code: true,
  name: true,
  department: true,
  year: true,
  lecturerId: true,
  schedule: true,
  isActive: true,
  activatedAt: true,
});

export const insertStudentCourseSchema = createInsertSchema(studentCourses).pick({
  studentId: true,
  courseId: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  studentId: true,
  courseId: true,
  status: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["student", "lecturer"]),
});

// Activate course schema
export const activateCourseSchema = z.object({
  courseId: z.number(),
  isActive: z.boolean(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertStudentCourse = z.infer<typeof insertStudentCourseSchema>;
export type StudentCourse = typeof studentCourses.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type LoginData = z.infer<typeof loginSchema>;
export type ActivateCourseData = z.infer<typeof activateCourseSchema>;
