import { type User, type InsertUser, type Client, type InsertClient, type Upload, type InsertUpload, type AdminProfile, type Idea, type InsertIdea, type SupportUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  getClientByToken(token: string): Promise<Client | undefined>;
  getClientByResetToken(token: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined>;
  
  getUploads(): Promise<Upload[]>;
  getUploadsByClientId(clientId: string): Promise<Upload[]>;
  getUpload(id: string): Promise<Upload | undefined>;
  createUpload(upload: InsertUpload): Promise<Upload>;
  updateUpload(id: string, updates: Partial<Upload>): Promise<Upload | undefined>;
  deleteUpload(id: string): Promise<boolean>;
  
  getAdminProfile(): Promise<AdminProfile>;
  updateAdminProfile(updates: Partial<AdminProfile>): Promise<AdminProfile>;
  
  getIdeas(): Promise<Idea[]>;
  getIdea(id: string): Promise<Idea | undefined>;
  createIdea(idea: InsertIdea): Promise<Idea>;
  deleteIdea(id: string): Promise<boolean>;
  
  getSupportUsersByClientId(clientId: string): Promise<SupportUser[]>;
  getSupportUser(id: string): Promise<SupportUser | undefined>;
  getSupportUserByEmail(email: string): Promise<SupportUser | undefined>;
  getSupportUserByToken(token: string): Promise<SupportUser | undefined>;
  createSupportUser(data: { email: string; clientId: string; name?: string }): Promise<SupportUser>;
  updateSupportUser(id: string, updates: Partial<SupportUser>): Promise<SupportUser | undefined>;
  deleteSupportUser(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private uploads: Map<string, Upload>;
  private ideas: Map<string, Idea>;
  private supportUsers: Map<string, SupportUser>;
  private adminProfile: AdminProfile;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.uploads = new Map();
    this.ideas = new Map();
    this.supportUsers = new Map();
    this.adminProfile = {
      id: "admin-1",
      email: "kate@blossomandbloommarketing.com",
      mobile: "01752 374533",
      notifyOnUpload: "true",
      notifyOnApproval: "true",
      updatedAt: new Date(),
    };
    
    this.seedData();
  }

  private seedData() {
    const client1: Client = {
      id: "client-1",
      email: "sarah@sarahsbakery.com",
      businessName: "Sarah's Bakery",
      businessType: "Restaurant/Cafe",
      notes: "Local bakery, focus on Instagram content",
      adminNotes: "Sarah prefers morning posts. She likes warm, cozy aesthetics. Always run Valentine's and holiday promotions early.",
      platforms: "instagram,facebook",
      status: "active",
      invitationToken: null,
      invitationExpiresAt: null,
      resetToken: null,
      resetTokenExpiresAt: null,
      password: "demo123",
      lastActiveAt: new Date("2026-02-02T08:30:00"),
      privacyAcceptedAt: null,
      approvalRemindersEnabled: "true",
      createdAt: new Date("2026-01-15"),
    };
    
    const client2: Client = {
      id: "client-2",
      email: "mike@mikesfitness.com",
      businessName: "Mike's Fitness",
      businessType: "Health & Fitness",
      notes: "Gym owner, TikTok and Reels focus",
      adminNotes: "Mike wants high-energy content. Focus on workout videos and transformations. He's very responsive and engaged.",
      platforms: "instagram,tiktok,facebook",
      status: "active",
      invitationToken: null,
      invitationExpiresAt: null,
      resetToken: null,
      resetTokenExpiresAt: null,
      password: "demo123",
      lastActiveAt: new Date("2026-02-01T16:45:00"),
      privacyAcceptedAt: null,
      approvalRemindersEnabled: "true",
      createdAt: new Date("2026-01-20"),
    };
    
    const client3: Client = {
      id: "client-3",
      email: "info@greengardenco.com",
      businessName: "Green Garden Co",
      businessType: "Retail",
      notes: "Plant nursery, seasonal campaigns",
      adminNotes: "Focus on seasonal content. Spring is their busiest time. They want educational posts about plant care.",
      platforms: "instagram,facebook",
      status: "active",
      invitationToken: null,
      invitationExpiresAt: null,
      resetToken: null,
      resetTokenExpiresAt: null,
      password: "demo123",
      lastActiveAt: new Date("2026-01-30T11:20:00"),
      privacyAcceptedAt: null,
      approvalRemindersEnabled: "true",
      createdAt: new Date("2026-01-25"),
    };

    const client4: Client = {
      id: "client-4",
      email: "testing@test.com",
      businessName: "Testing",
      businessType: "Services",
      notes: "Test client",
      adminNotes: null,
      platforms: "instagram,facebook",
      status: "active",
      invitationToken: null,
      invitationExpiresAt: null,
      resetToken: null,
      resetTokenExpiresAt: null,
      password: "demo123",
      lastActiveAt: new Date("2026-02-02T17:00:00"),
      privacyAcceptedAt: null,
      approvalRemindersEnabled: "true",
      createdAt: new Date("2026-02-02"),
    };
    
    this.clients.set(client1.id, client1);
    this.clients.set(client2.id, client2);
    this.clients.set(client3.id, client3);
    this.clients.set(client4.id, client4);
    
    const upload1: Upload = {
      id: "upload-1",
      clientId: "client-1",
      type: "image",
      uri: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
      thumbnail: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200",
      caption: null,
      hashtags: null,
      platform: null,
      clientNotes: "Please post this on Instagram around 8am when people are thinking about breakfast. Use hashtags #freshbaked #croissants #morningvibes",
      status: "new",
      approvalStatus: "pending",
      reminderSentAt: null,
      autoApproved: "false",
      scheduledFor: null,
      scheduledAt: null,
      uploadedAt: new Date("2026-02-02T09:30:00"),
    };
    
    const upload2: Upload = {
      id: "upload-2",
      clientId: "client-1",
      type: "image",
      uri: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400",
      thumbnail: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=200",
      caption: null,
      hashtags: null,
      platform: null,
      clientNotes: "This is for our Valentine's promotion. Can we schedule for Feb 10th on all platforms?",
      status: "new",
      approvalStatus: "pending",
      reminderSentAt: null,
      autoApproved: "false",
      scheduledFor: null,
      scheduledAt: null,
      uploadedAt: new Date("2026-02-01T14:15:00"),
    };
    
    const upload3: Upload = {
      id: "upload-3",
      clientId: "client-2",
      type: "video",
      uri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
      thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200",
      caption: null,
      hashtags: null,
      platform: null,
      clientNotes: "This is a 30-second preview of our new workout. Please add some energetic music and post on TikTok and Instagram Reels.",
      status: "new",
      approvalStatus: "pending",
      reminderSentAt: null,
      autoApproved: "false",
      scheduledFor: null,
      scheduledAt: null,
      uploadedAt: new Date("2026-02-02T07:00:00"),
    };
    
    const upload4: Upload = {
      id: "upload-4",
      clientId: "client-3",
      type: "image",
      uri: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
      thumbnail: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200",
      caption: null,
      hashtags: null,
      platform: null,
      clientNotes: null,
      status: "new",
      approvalStatus: "pending",
      reminderSentAt: null,
      autoApproved: "false",
      scheduledFor: null,
      scheduledAt: null,
      uploadedAt: new Date("2026-02-02T11:00:00"),
    };
    
    this.uploads.set(upload1.id, upload1);
    this.uploads.set(upload2.id, upload2);
    this.uploads.set(upload3.id, upload3);
    this.uploads.set(upload4.id, upload4);
    
    // Helper to get dates relative to current week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + daysToMonday);
    thisMonday.setHours(0, 0, 0, 0);

    const getThisWeekDate = (dayOffset: number, hour: number) => {
      const d = new Date(thisMonday);
      d.setDate(thisMonday.getDate() + dayOffset);
      d.setHours(hour, 0, 0, 0);
      return d;
    };

    const getNextWeekDate = (dayOffset: number, hour: number) => {
      const d = new Date(thisMonday);
      d.setDate(thisMonday.getDate() + 7 + dayOffset);
      d.setHours(hour, 0, 0, 0);
      return d;
    };

    // Scheduled posts for this week
    const scheduledUpload1: Upload = {
      id: "scheduled-1",
      clientId: "client-1",
      type: "image",
      uri: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400",
      thumbnail: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200",
      caption: "Fresh croissants straight from the oven! Start your morning right with our buttery, flaky pastries.",
      hashtags: "#freshbaked #croissants #morningvibes #bakery #breakfast",
      platform: "instagram",
      clientNotes: "Morning post for croissants",
      status: "scheduled",
      approvalStatus: "pending",
      reminderSentAt: null,
      autoApproved: "false",
      scheduledFor: getThisWeekDate(2, 9),
      scheduledAt: getThisWeekDate(0, 10),
      uploadedAt: getThisWeekDate(-2, 9),
    };
    
    const scheduledUpload2: Upload = {
      id: "scheduled-2",
      clientId: "client-1",
      type: "image",
      uri: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
      thumbnail: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200",
      caption: "Weekend special! Our famous sourdough bread is back in stock. Limited quantities available!",
      hashtags: "#sourdough #artisanbread #weekendvibes #bakerylife",
      platform: "facebook",
      clientNotes: "Weekend bread promotion",
      status: "scheduled",
      approvalStatus: "approved",
      reminderSentAt: null,
      autoApproved: "false",
      scheduledFor: getThisWeekDate(4, 11),
      scheduledAt: getThisWeekDate(0, 11),
      uploadedAt: getThisWeekDate(-2, 10),
    };
    
    const scheduledUpload3: Upload = {
      id: "scheduled-3",
      clientId: "client-1",
      type: "video",
      uri: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=400",
      thumbnail: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=200",
      caption: "Behind the scenes at Sarah's Bakery! Watch how we make our signature cinnamon rolls.",
      hashtags: "#behindthescenes #bakery #cinnamonrolls #foodtiktok",
      platform: "tiktok",
      clientNotes: "Fun behind the scenes video",
      status: "scheduled",
      approvalStatus: "pending",
      reminderSentAt: null,
      autoApproved: "false",
      scheduledFor: getThisWeekDate(3, 14),
      scheduledAt: getThisWeekDate(0, 12),
      uploadedAt: getThisWeekDate(-2, 11),
    };
    
    // Scheduled posts for next week
    const scheduledUpload4: Upload = {
      id: "scheduled-4",
      clientId: "client-1",
      type: "image",
      uri: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400",
      thumbnail: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=200",
      caption: "Spring is here! Pre-order our special flower-shaped cookies now!",
      hashtags: "#spring #cookies #treatyourself #giftideas",
      platform: "instagram",
      clientNotes: "Spring promotion - important!",
      status: "scheduled",
      approvalStatus: "pending",
      reminderSentAt: null,
      autoApproved: "false",
      scheduledFor: getNextWeekDate(0, 10),
      scheduledAt: getThisWeekDate(1, 9),
      uploadedAt: getThisWeekDate(-1, 8),
    };
    
    const scheduledUpload5: Upload = {
      id: "scheduled-5",
      clientId: "client-1",
      type: "image",
      uri: "https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=400",
      thumbnail: "https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=200",
      caption: "Fresh pastries and great coffee - the perfect combo! Visit us this week.",
      hashtags: "#pastries #coffee #sweettreats #brunch",
      platform: "facebook",
      clientNotes: "Midweek pastry and coffee promo",
      status: "scheduled",
      approvalStatus: "approved",
      reminderSentAt: null,
      autoApproved: "false",
      scheduledFor: getNextWeekDate(2, 9),
      scheduledAt: getThisWeekDate(1, 10),
      uploadedAt: getThisWeekDate(-1, 9),
    };
    
    const scheduledUpload6: Upload = {
      id: "scheduled-6",
      clientId: "client-1",
      type: "video",
      uri: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
      thumbnail: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200",
      caption: "Cake decorating masterclass! Watch our pastry chef create magic.",
      hashtags: "#cakedecorating #satisfying #asmr #bakerylife",
      platform: "tiktok",
      clientNotes: "Cake decorating video",
      status: "scheduled",
      approvalStatus: "pending",
      reminderSentAt: null,
      autoApproved: "false",
      scheduledFor: getNextWeekDate(3, 15),
      scheduledAt: getThisWeekDate(1, 11),
      uploadedAt: getThisWeekDate(-1, 10),
    };
    
    this.uploads.set(scheduledUpload1.id, scheduledUpload1);
    this.uploads.set(scheduledUpload2.id, scheduledUpload2);
    this.uploads.set(scheduledUpload3.id, scheduledUpload3);
    this.uploads.set(scheduledUpload4.id, scheduledUpload4);
    this.uploads.set(scheduledUpload5.id, scheduledUpload5);
    this.uploads.set(scheduledUpload6.id, scheduledUpload6);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async getClientByToken(token: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.invitationToken === token,
    );
  }

  async getClientByResetToken(token: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.resetToken === token,
    );
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      id,
      email: insertClient.email,
      businessName: insertClient.businessName,
      businessType: insertClient.businessType ?? null,
      notes: insertClient.notes ?? null,
      adminNotes: null,
      platforms: "instagram",
      status: "pending",
      invitationToken: null,
      invitationExpiresAt: null,
      resetToken: null,
      resetTokenExpiresAt: null,
      password: null,
      lastActiveAt: null,
      privacyAcceptedAt: null,
      approvalRemindersEnabled: "true",
      createdAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    const updated = { ...client, ...updates };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    const client = this.clients.get(id);
    if (!client) return false;
    this.clients.delete(id);
    // Also delete all uploads for this client
    for (const [uploadId, upload] of this.uploads.entries()) {
      if (upload.clientId === id) {
        this.uploads.delete(uploadId);
      }
    }
    return true;
  }

  async getUploads(): Promise<Upload[]> {
    return Array.from(this.uploads.values());
  }

  async getUploadsByClientId(clientId: string): Promise<Upload[]> {
    return Array.from(this.uploads.values()).filter(
      (upload) => upload.clientId === clientId,
    );
  }

  async getUpload(id: string): Promise<Upload | undefined> {
    return this.uploads.get(id);
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const id = randomUUID();
    const upload: Upload = {
      id,
      clientId: insertUpload.clientId,
      type: insertUpload.type,
      uri: insertUpload.uri,
      thumbnail: insertUpload.thumbnail ?? null,
      caption: insertUpload.caption ?? null,
      hashtags: null,
      platform: null,
      clientNotes: insertUpload.clientNotes ?? null,
      status: "new",
      approvalStatus: "pending",
      reminderSentAt: null,
      autoApproved: "false",
      scheduledFor: null,
      scheduledAt: null,
      uploadedAt: new Date(),
    };
    this.uploads.set(id, upload);
    return upload;
  }

  async updateUpload(id: string, updates: Partial<Upload>): Promise<Upload | undefined> {
    const upload = this.uploads.get(id);
    if (!upload) return undefined;
    const updated = { ...upload, ...updates };
    this.uploads.set(id, updated);
    return updated;
  }

  async deleteUpload(id: string): Promise<boolean> {
    return this.uploads.delete(id);
  }

  async getAdminProfile(): Promise<AdminProfile> {
    return this.adminProfile;
  }

  async updateAdminProfile(updates: Partial<AdminProfile>): Promise<AdminProfile> {
    this.adminProfile = {
      ...this.adminProfile,
      ...updates,
      updatedAt: new Date(),
    };
    return this.adminProfile;
  }

  async getIdeas(): Promise<Idea[]> {
    return Array.from(this.ideas.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getIdea(id: string): Promise<Idea | undefined> {
    return this.ideas.get(id);
  }

  async createIdea(insertIdea: InsertIdea): Promise<Idea> {
    const id = randomUUID();
    const idea: Idea = {
      id,
      title: insertIdea.title,
      description: insertIdea.description,
      platform: insertIdea.platform ?? "all",
      category: insertIdea.category ?? null,
      clientIds: insertIdea.clientIds ?? null,
      isFavourite: insertIdea.isFavourite ?? "false",
      createdAt: new Date(),
    };
    this.ideas.set(id, idea);
    return idea;
  }

  async deleteIdea(id: string): Promise<boolean> {
    return this.ideas.delete(id);
  }

  async getSupportUsersByClientId(clientId: string): Promise<SupportUser[]> {
    return Array.from(this.supportUsers.values()).filter(
      (su) => su.clientId === clientId,
    );
  }

  async getSupportUser(id: string): Promise<SupportUser | undefined> {
    return this.supportUsers.get(id);
  }

  async getSupportUserByEmail(email: string): Promise<SupportUser | undefined> {
    return Array.from(this.supportUsers.values()).find(
      (su) => su.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async getSupportUserByToken(token: string): Promise<SupportUser | undefined> {
    return Array.from(this.supportUsers.values()).find(
      (su) => su.invitationToken === token,
    );
  }

  async createSupportUser(data: { email: string; clientId: string; name?: string }): Promise<SupportUser> {
    const id = randomUUID();
    const supportUser: SupportUser = {
      id,
      email: data.email,
      password: null,
      clientId: data.clientId,
      name: data.name ?? null,
      status: "pending",
      invitationToken: null,
      invitationExpiresAt: null,
      createdAt: new Date(),
    };
    this.supportUsers.set(id, supportUser);
    return supportUser;
  }

  async updateSupportUser(id: string, updates: Partial<SupportUser>): Promise<SupportUser | undefined> {
    const su = this.supportUsers.get(id);
    if (!su) return undefined;
    const updated = { ...su, ...updates };
    this.supportUsers.set(id, updated);
    return updated;
  }

  async deleteSupportUser(id: string): Promise<boolean> {
    return this.supportUsers.delete(id);
  }
}

export const storage = new MemStorage();
