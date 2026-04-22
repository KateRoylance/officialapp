import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import { storage } from "./storage";
import { sendInvitationEmail, sendApprovalReminderEmail, sendPasswordResetEmail, sendRejectionNotificationEmail } from "./email";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all uploads (for admin)
  app.get("/api/uploads", async (req, res) => {
    try {
      const uploads = await storage.getUploads();
      const clients = await storage.getClients();
      
      // Filter out scheduled uploads that are 48+ hours past their scheduled time
      const now = Date.now();
      const filteredUploads = uploads.filter(upload => {
        if (upload.status === "scheduled" && upload.scheduledFor) {
          const scheduledTime = new Date(upload.scheduledFor).getTime();
          const hoursSinceScheduled = (now - scheduledTime) / (1000 * 60 * 60);
          return hoursSinceScheduled < 48;
        }
        return true;
      });
      
      // Start with ALL active clients (not pending)
      const activeClients = clients.filter(c => c.status === "active");
      const groupedUploads: Record<string, { client: { id: string; name: string; avatar: string }; uploads: typeof filteredUploads }> = {};
      
      // Add all active clients first (even without uploads)
      for (const client of activeClients) {
        groupedUploads[client.id] = {
          client: {
            id: client.id,
            name: client.businessName,
            avatar: client.businessName.charAt(0).toUpperCase(),
          },
          uploads: [],
        };
      }
      
      // Then add uploads to their respective clients
      for (const upload of filteredUploads) {
        if (groupedUploads[upload.clientId]) {
          groupedUploads[upload.clientId].uploads.push(upload);
        }
      }
      
      res.json(Object.values(groupedUploads));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch uploads" });
    }
  });
  
  // Get uploads for a specific client
  app.get("/api/uploads/client/:clientId", async (req, res) => {
    try {
      const uploads = await storage.getUploadsByClientId(req.params.clientId);
      res.json(uploads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch uploads" });
    }
  });
  
  // Create a new upload (from client portal)
  app.post("/api/uploads", async (req, res) => {
    try {
      const { clientId, type, uri, thumbnail, caption, clientNotes } = req.body;
      
      if (!clientId || !type || !uri) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const upload = await storage.createUpload({
        clientId,
        type,
        uri,
        thumbnail: thumbnail || uri,
        caption,
        clientNotes,
      });
      
      res.status(201).json(upload);
    } catch (error) {
      res.status(500).json({ error: "Failed to create upload" });
    }
  });
  
  // Update upload status (from admin)
  app.patch("/api/uploads/:id", async (req, res) => {
    try {
      const { status, scheduledFor, caption, hashtags, platform, approvalStatus, clientNotes } = req.body;
      
      const updates: any = {};
      if (status !== undefined) {
        updates.status = status;
        if (status === "scheduled" && scheduledFor) {
          updates.scheduledFor = new Date(scheduledFor);
          updates.scheduledAt = new Date();
        }
      }
      if (caption !== undefined) updates.caption = caption;
      if (hashtags !== undefined) updates.hashtags = hashtags;
      if (platform !== undefined) updates.platform = platform;
      if (approvalStatus !== undefined) updates.approvalStatus = approvalStatus;
      if (clientNotes !== undefined) updates.clientNotes = clientNotes;
      
      // Get the existing upload before updating (for rejection email)
      const existingUpload = await storage.getUpload(req.params.id);
      
      const upload = await storage.updateUpload(req.params.id, updates);
      
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }
      
      // Send rejection notification email if post was rejected
      if (approvalStatus === "rejected" && existingUpload) {
        const client = await storage.getClient(existingUpload.clientId);
        if (client) {
          const scheduledDate = existingUpload.scheduledFor 
            ? new Date(existingUpload.scheduledFor).toLocaleDateString("en-US", { 
                weekday: "long", 
                month: "long", 
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
              })
            : "Not scheduled";
          
          const emailResult = await sendRejectionNotificationEmail(
            existingUpload.caption || "",
            existingUpload.platform || "Unknown",
            scheduledDate,
            client.businessName,
            clientNotes || "No feedback provided"
          );
          
          if (!emailResult.success) {
            console.warn('Failed to send rejection notification email:', emailResult.error);
          }
        }
      }
      
      res.json(upload);
    } catch (error) {
      res.status(500).json({ error: "Failed to update upload" });
    }
  });
  
  // Delete upload
  app.delete("/api/uploads/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUpload(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Upload not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete upload" });
    }
  });
  
  // Get all clients with stats
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      const uploads = await storage.getUploads();
      
      // Add stats to each client
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const nextWeekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const clientsWithStats = clients.map(client => {
        const clientUploads = uploads.filter(u => u.clientId === client.id);
        const pendingCount = clientUploads.filter(u => u.status === "new").length;
        const scheduledNextWeek = clientUploads.filter(u => {
          if (u.status !== "scheduled" || !u.scheduledFor) return false;
          const scheduledDate = new Date(u.scheduledFor);
          return scheduledDate >= now && scheduledDate <= nextWeekEnd;
        }).length;
        
        // Determine activity status based on lastActiveAt
        let activityStatus = "inactive";
        if (client.status === "pending") {
          activityStatus = "pending";
        } else if (client.lastActiveAt) {
          const lastActive = new Date(client.lastActiveAt);
          if (lastActive >= fortyEightHoursAgo) {
            activityStatus = "active";
          }
        }
        
        return {
          ...client,
          pendingCount,
          scheduledNextWeek,
          activityStatus,
        };
      });
      
      res.json(clientsWithStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });
  
  // Get single client with details
  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const uploads = await storage.getUploadsByClientId(client.id);
      
      const now = new Date();
      const thisWeekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextWeekEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      const pendingApproval = uploads.filter(u => u.status === "new").length;
      const scheduledThisWeek = uploads.filter(u => {
        if (u.status !== "scheduled" || !u.scheduledFor) return false;
        const scheduledDate = new Date(u.scheduledFor);
        return scheduledDate >= now && scheduledDate <= thisWeekEnd;
      }).length;
      const scheduledNextWeek = uploads.filter(u => {
        if (u.status !== "scheduled" || !u.scheduledFor) return false;
        const scheduledDate = new Date(u.scheduledFor);
        return scheduledDate > thisWeekEnd && scheduledDate <= nextWeekEnd;
      }).length;
      
      res.json({
        ...client,
        pendingApproval,
        scheduledThisWeek,
        scheduledNextWeek,
        totalUploads: uploads.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });
  
  // Update client admin notes
  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const { adminNotes, platforms, status, lastActiveAt, email } = req.body;
      
      const updates: any = {};
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;
      if (platforms !== undefined) updates.platforms = platforms;
      if (status !== undefined) updates.status = status;
      if (lastActiveAt !== undefined) updates.lastActiveAt = new Date(lastActiveAt);
      if (email !== undefined) updates.email = email;
      
      const client = await storage.updateClient(req.params.id, updates);
      
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  // Delete client
  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteClient(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      res.json({ success: true, message: "Client deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete client" });
    }
  });
  
  // Get admin profile
  app.get("/api/admin/profile", async (req, res) => {
    try {
      const profile = await storage.getAdminProfile();
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin profile" });
    }
  });

  // Update admin profile
  app.patch("/api/admin/profile", async (req, res) => {
    try {
      const { email, mobile, notifyOnUpload, notifyOnApproval } = req.body;
      const updates: any = {};
      if (email !== undefined) updates.email = email;
      if (mobile !== undefined) updates.mobile = mobile;
      if (notifyOnUpload !== undefined) updates.notifyOnUpload = notifyOnUpload;
      if (notifyOnApproval !== undefined) updates.notifyOnApproval = notifyOnApproval;
      
      const profile = await storage.updateAdminProfile(updates);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update admin profile" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const clients = await storage.getClients();
      const uploads = await storage.getUploads();
      
      const activeClients = clients.filter(c => c.status === "active");
      const totalClients = activeClients.length;
      
      // Pending approvals: scheduled uploads awaiting client approval
      const pendingApprovals = uploads.filter(u => 
        u.status === "scheduled" && u.approvalStatus === "pending"
      ).length;
      
      // Today's scheduled posts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todaysScheduledPosts = uploads.filter(u => {
        if (u.status !== "scheduled" || !u.scheduledFor) return false;
        const scheduledDate = new Date(u.scheduledFor);
        return scheduledDate >= today && scheduledDate < tomorrow;
      }).length;
      
      // Client activity data
      const clientActivity = clients
        .filter(c => c.status === "active")
        .map(client => {
          const clientUploads = uploads.filter(u => u.clientId === client.id);
          const pendingCount = clientUploads.filter(u => 
            u.status === "scheduled" && u.approvalStatus === "pending"
          ).length;
          const newUploads = clientUploads.filter(u => u.status === "new").length;
          
          let recentActivity: string = "none";
          if (newUploads > 0) recentActivity = "upload";
          else if (pendingCount > 0) recentActivity = "approval";
          
          const lastActive = client.lastActiveAt 
            ? formatTimeAgo(new Date(client.lastActiveAt))
            : "Never";
          
          return {
            id: client.id,
            name: client.businessName,
            pendingApprovals: pendingCount,
            lastActive,
            recentActivity,
          };
        })
        .sort((a, b) => b.pendingApprovals - a.pendingApprovals);
      
      // Active clients: clients who have been active in the last 48 hours
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const recentlyActiveClients = activeClients.filter(c => {
        if (!c.lastActiveAt) return false;
        const lastActive = new Date(c.lastActiveAt);
        return lastActive >= fortyEightHoursAgo;
      }).length;
      
      res.json({
        totalClients,
        pendingApprovals,
        todaysScheduledPosts,
        activeClients: recentlyActiveClients,
        clientActivity,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Get all ideas (for admin)
  app.get("/api/ideas", async (req, res) => {
    try {
      const ideas = await storage.getIdeas();
      const clients = await storage.getClients();
      const clientMap = new Map(clients.map(c => [c.id, c.businessName]));
      
      const ideasWithClientNames = ideas.map(idea => ({
        ...idea,
        clientNames: idea.clientIds 
          ? idea.clientIds.split(",").map(id => clientMap.get(id) || "Unknown").join(", ")
          : null,
      }));
      
      res.json(ideasWithClientNames);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ideas" });
    }
  });

  // Get ideas for a specific client
  app.get("/api/ideas/client/:clientId", async (req, res) => {
    try {
      const ideas = await storage.getIdeas();
      const clientIdeas = ideas.filter(idea => 
        idea.clientIds && idea.clientIds.split(",").includes(req.params.clientId)
      );
      res.json(clientIdeas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ideas" });
    }
  });

  // Create a new idea
  app.post("/api/ideas", async (req, res) => {
    try {
      const { title, description, platform, category, clientIds, isFavourite, link, mediaUri, mediaType } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
      }
      
      if (!clientIds || clientIds.length === 0) {
        return res.status(400).json({ error: "Please select at least one client" });
      }
      
      const idea = await storage.createIdea({
        title,
        description,
        platform,
        category,
        clientIds: Array.isArray(clientIds) ? clientIds.join(",") : clientIds,
        isFavourite: isFavourite ? "true" : "false",
        link: link || null,
        mediaUri: mediaUri || null,
        mediaType: mediaType || null,
      });
      
      res.status(201).json(idea);
    } catch (error) {
      res.status(500).json({ error: "Failed to create idea" });
    }
  });

  // Delete an idea
  app.delete("/api/ideas/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteIdea(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Idea not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete idea" });
    }
  });

  // Get client by email (for login)
  // Create new client (admin enrollment)
  app.post("/api/clients", async (req, res) => {
    try {
      const { businessName, email, businessType, notes, platforms } = req.body;
      
      if (!businessName || !email) {
        return res.status(400).json({ error: "Business name and email are required" });
      }
      
      // Check if email already exists
      const existing = await storage.getClientByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "A client with this email already exists" });
      }
      
      const client = await storage.createClient({
        businessName,
        email: email.toLowerCase(),
        businessType: businessType || null,
        notes: notes || null,
      });
      
      // Update platforms if provided
      if (platforms) {
        await storage.updateClient(client.id, { platforms });
      }
      
      // Generate invitation token
      const invitationToken = randomUUID();
      const invitationExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
      
      await storage.updateClient(client.id, {
        invitationToken,
        invitationExpiresAt,
      });
      
      // Send invitation email
      const emailResult = await sendInvitationEmail(
        email.toLowerCase(),
        businessName,
        invitationToken
      );
      
      if (!emailResult.success) {
        console.warn('Failed to send invitation email:', emailResult.error);
      }
      
      res.status(201).json({ 
        ...client, 
        emailSent: emailResult.success,
        emailError: emailResult.error 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  // Resend invitation email
  app.post("/api/clients/:id/resend-invitation", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      if (client.status === "active") {
        return res.status(400).json({ error: "Client has already activated their account" });
      }
      
      // Generate new invitation token
      const invitationToken = randomUUID();
      const invitationExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      await storage.updateClient(client.id, {
        invitationToken,
        invitationExpiresAt,
      });
      
      // Send invitation email
      const emailResult = await sendInvitationEmail(
        client.email,
        client.businessName,
        invitationToken
      );
      
      if (!emailResult.success) {
        return res.status(500).json({ error: "Failed to send invitation email: " + emailResult.error });
      }
      
      res.json({ success: true, message: "Invitation email sent successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to resend invitation" });
    }
  });

  app.post("/api/clients/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check support users first
      const supportUser = await storage.getSupportUserByEmail(email);
      if (supportUser) {
        if (!supportUser.password || supportUser.password !== password) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        const client = await storage.getClient(supportUser.clientId);
        return res.json({
          id: supportUser.id,
          email: supportUser.email,
          businessName: client?.businessName || "Support",
          businessType: client?.businessType || null,
          privacyAcceptedAt: new Date().toISOString(),
          role: "support",
          clientId: supportUser.clientId,
          name: supportUser.name,
        });
      }
      
      const client = await storage.getClientByEmail(email);
      
      if (!client || client.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Update status to active on first login and update last active time
      const updates: any = { lastActiveAt: new Date() };
      if (client.status === "pending") {
        updates.status = "active";
      }
      await storage.updateClient(client.id, updates);
      
      res.json({
        id: client.id,
        email: client.email,
        businessName: client.businessName,
        businessType: client.businessType,
        privacyAcceptedAt: client.privacyAcceptedAt,
        role: "client",
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Request password reset - sends email with reset link
  app.post("/api/clients/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const client = await storage.getClientByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!client || !client.password) {
        return res.json({ success: true, message: "If an account exists, a password reset email has been sent" });
      }
      
      // Generate reset token (expires in 1 hour)
      const resetToken = randomUUID();
      const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      await storage.updateClient(client.id, {
        resetToken,
        resetTokenExpiresAt,
      });
      
      // Send password reset email
      const emailResult = await sendPasswordResetEmail(
        client.email,
        client.businessName,
        resetToken
      );
      
      if (!emailResult.success) {
        console.warn('Failed to send password reset email:', emailResult.error);
      }
      
      res.json({ success: true, message: "If an account exists, a password reset email has been sent" });
    } catch (error) {
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Verify reset token is valid
  app.get("/api/clients/verify-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const client = await storage.getClientByResetToken(token);
      
      if (!client) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }
      
      // Check if token is expired
      if (!client.resetTokenExpiresAt || new Date() > new Date(client.resetTokenExpiresAt)) {
        return res.status(400).json({ error: "Reset link has expired. Please request a new one." });
      }
      
      res.json({ 
        valid: true, 
        email: client.email,
        businessName: client.businessName 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify reset token" });
    }
  });

  // Reset password with token
  app.post("/api/clients/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      
      const client = await storage.getClientByResetToken(token);
      
      if (!client) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }
      
      // Check if token is expired
      if (!client.resetTokenExpiresAt || new Date() > new Date(client.resetTokenExpiresAt)) {
        return res.status(400).json({ error: "Reset link has expired. Please request a new one." });
      }
      
      // Update password and clear reset token
      await storage.updateClient(client.id, {
        password,
        resetToken: null,
        resetTokenExpiresAt: null,
        status: "active", // Ensure account is active
      });
      
      res.json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Accept privacy policy
  app.post("/api/clients/:clientId/accept-privacy", async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      await storage.updateClient(clientId, { privacyAcceptedAt: new Date() });
      
      res.json({ success: true, privacyAcceptedAt: new Date() });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept privacy policy" });
    }
  });

  // Get client notification settings
  app.get("/api/clients/:clientId/notification-settings", async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      res.json({
        approvalRemindersEnabled: client.approvalRemindersEnabled || "true",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  // Update client notification settings
  app.patch("/api/clients/:clientId/notification-settings", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { approvalRemindersEnabled } = req.body;
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      await storage.updateClient(clientId, { approvalRemindersEnabled });
      
      res.json({ success: true, approvalRemindersEnabled });
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Support user management routes
  app.get("/api/clients/:clientId/support-users", async (req, res) => {
    try {
      const supportUsers = await storage.getSupportUsersByClientId(req.params.clientId);
      res.json(supportUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch support users" });
    }
  });

  app.post("/api/clients/:clientId/support-users", async (req, res) => {
    try {
      const { email, name } = req.body;
      const { clientId } = req.params;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const existingClient = await storage.getClientByEmail(email);
      const existingSupport = await storage.getSupportUserByEmail(email);
      if (existingClient || existingSupport) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }

      const supportUser = await storage.createSupportUser({ email, clientId, name });

      const invitationToken = randomUUID();
      const invitationExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await storage.updateSupportUser(supportUser.id, { invitationToken, invitationExpiresAt });

      try {
        await sendInvitationEmail(email, client.businessName, invitationToken);
      } catch (emailError) {
        console.warn("Failed to send support user invitation email:", emailError);
      }

      res.status(201).json(supportUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to create support user" });
    }
  });

  app.delete("/api/support-users/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSupportUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Support user not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete support user" });
    }
  });

  app.post("/api/set-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }

      const client = await storage.getClientByToken(token);
      if (client) {
        if (client.invitationExpiresAt && new Date() > new Date(client.invitationExpiresAt)) {
          return res.status(400).json({ error: "Invitation has expired" });
        }
        await storage.updateClient(client.id, {
          password,
          status: "active",
          invitationToken: null,
          invitationExpiresAt: null,
        });
        return res.json({ success: true, type: "client" });
      }

      const supportUser = await storage.getSupportUserByToken(token);
      if (supportUser) {
        if (supportUser.invitationExpiresAt && new Date() > new Date(supportUser.invitationExpiresAt)) {
          return res.status(400).json({ error: "Invitation has expired" });
        }
        await storage.updateSupportUser(supportUser.id, {
          password,
          status: "active",
          invitationToken: null,
          invitationExpiresAt: null,
        });
        return res.json({ success: true, type: "support" });
      }

      return res.status(400).json({ error: "Invalid or expired invitation" });
    } catch (error) {
      res.status(500).json({ error: "Failed to set password" });
    }
  });

  // Start the approval reminder check interval
  startApprovalReminderJob();

  const httpServer = createServer(app);
  return httpServer;
}

// Background job to check for pending approvals and send reminders
async function startApprovalReminderJob() {
  const HOUR_IN_MS = 60 * 60 * 1000;
  
  const checkPendingApprovals = async () => {
    try {
      const now = new Date();
      const uploads = await storage.getUploads();
      const clients = await storage.getClients();
      const clientMap = new Map(clients.map(c => [c.id, c]));
      
      for (const upload of uploads) {
        if (upload.status !== "scheduled" || upload.approvalStatus !== "pending" || !upload.scheduledFor) {
          continue;
        }
        
        const scheduledTime = new Date(upload.scheduledFor).getTime();
        const hoursUntilScheduled = (scheduledTime - now.getTime()) / HOUR_IN_MS;
        const client = clientMap.get(upload.clientId);
        
        if (!client) continue;
        
        // Auto-approve if less than 48 hours remaining and reminder was sent
        if (hoursUntilScheduled <= 48 && upload.reminderSentAt) {
          await storage.updateUpload(upload.id, {
            approvalStatus: "approved",
            autoApproved: "true",
          });
          console.log(`Auto-approved upload ${upload.id} for client ${client.businessName}`);
          continue;
        }
        
        // Send reminder if 72 hours or less remaining and reminder not yet sent
        if (hoursUntilScheduled <= 72 && hoursUntilScheduled > 48 && !upload.reminderSentAt) {
          // Check if client has reminders enabled
          if (client.approvalRemindersEnabled !== "false") {
            const scheduledDate = new Date(upload.scheduledFor).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            });
            
            const platformName = upload.platform 
              ? upload.platform.charAt(0).toUpperCase() + upload.platform.slice(1)
              : "Social Media";
            
            const emailResult = await sendApprovalReminderEmail(
              client.email,
              client.businessName,
              upload.caption || "Your scheduled post",
              platformName,
              scheduledDate
            );
            
            if (emailResult.success) {
              await storage.updateUpload(upload.id, { reminderSentAt: new Date() });
              console.log(`Sent approval reminder for upload ${upload.id} to ${client.email}`);
            } else {
              console.warn(`Failed to send reminder email for upload ${upload.id}:`, emailResult.error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in approval reminder job:", error);
    }
  };
  
  // Run shortly after startup (30s delay to allow server to fully initialise)
  setTimeout(checkPendingApprovals, 30000);
  
  // Then run every hour
  setInterval(checkPendingApprovals, HOUR_IN_MS);
  
  console.log("Approval reminder job started - checking every hour");
}
