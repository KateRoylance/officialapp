import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const clients = pgTable("clients", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  businessName: text("business_name").notNull(),
  businessType: text("business_type"),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  platforms: text("platforms"),
  status: text("status").notNull().default("pending"),
  invitationToken: text("invitation_token"),
  invitationExpiresAt: timestamp("invitation_expires_at"),
  resetToken: text("reset_token"),
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),
  password: text("password"),
  lastActiveAt: timestamp("last_active_at"),
  privacyAcceptedAt: timestamp("privacy_accepted_at"),
  approvalRemindersEnabled: text("approval_reminders_enabled").default("true"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminProfile = pgTable("admin_profile", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  mobile: text("mobile"),
  notifyOnUpload: text("notify_on_upload").default("true"),
  notifyOnApproval: text("notify_on_approval").default("true"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const uploads = pgTable("uploads", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  type: text("type").notNull(),
  uri: text("uri").notNull(),
  thumbnail: text("thumbnail"),
  caption: text("caption"),
  hashtags: text("hashtags"),
  platform: text("platform"),
  clientNotes: text("client_notes"),
  status: text("status").notNull().default("new"),
  approvalStatus: text("approval_status").default("pending"),
  reminderSentAt: timestamp("reminder_sent_at"),
  autoApproved: text("auto_approved").default("false"),
  scheduledFor: timestamp("scheduled_for"),
  scheduledAt: timestamp("scheduled_at"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const ideas = pgTable("ideas", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  platform: text("platform").default("all"),
  category: text("category"),
  clientIds: text("client_ids"),
  isFavourite: text("is_favourite").default("false"),
  link: text("link"),
  mediaUri: text("media_uri"),
  mediaType: text("media_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supportUsers = pgTable("support_users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  password: text("password"),
  clientId: varchar("client_id").notNull(),
  name: text("name"),
  status: text("status").notNull().default("pending"),
  invitationToken: text("invitation_token"),
  invitationExpiresAt: timestamp("invitation_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertClientSchema = createInsertSchema(clients).pick({
  email: true,
  businessName: true,
  businessType: true,
  notes: true,
});

export const insertUploadSchema = createInsertSchema(uploads).pick({
  clientId: true,
  type: true,
  uri: true,
  thumbnail: true,
  caption: true,
  clientNotes: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type Upload = typeof uploads.$inferSelect;
export type AdminProfile = typeof adminProfile.$inferSelect;
export type Idea = typeof ideas.$inferSelect;
export type SupportUser = typeof supportUsers.$inferSelect;
export type InsertIdea = { title: string; description: string; platform?: string; category?: string; clientIds?: string; isFavourite?: string; link?: string | null; mediaUri?: string | null; mediaType?: string | null };
