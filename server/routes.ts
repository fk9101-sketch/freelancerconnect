import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertLeadSchema, insertFreelancerProfileSchema, insertSubscriptionSchema, insertLeadInterestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // WebSocket server for real-time notifications
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const connectedClients = new Map<string, WebSocket>();

  wss.on('connection', (ws, req) => {
    // Extract user ID from query params or handle auth here
    const userId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('userId');
    
    if (userId) {
      connectedClients.set(userId, ws);
      
      ws.on('close', () => {
        connectedClients.delete(userId);
      });
    }
  });

  // Broadcast notification to specific user
  const notifyUser = (userId: string, data: any) => {
    const client = connectedClients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Role selection
  app.post('/api/auth/select-role', isAuthenticated, async (req: any, res) => {
    try {
      const { role } = req.body;
      const userId = req.user.claims.sub;
      
      if (!['customer', 'freelancer', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      await storage.updateUserRole(userId, role);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Freelancer profile routes
  app.get('/api/freelancer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching freelancer profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/freelancer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertFreelancerProfileSchema.parse({
        ...req.body,
        userId
      });
      
      const profile = await storage.createFreelancerProfile(profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error creating freelancer profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.get('/api/freelancer/leads/available', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      const leads = await storage.getAvailableLeads(profile.id);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching available leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get('/api/freelancer/leads/accepted', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      const leads = await storage.getLeadsByFreelancer(profile.id);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching accepted leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post('/api/freelancer/leads/:leadId/accept', isAuthenticated, async (req: any, res) => {
    try {
      const { leadId } = req.params;
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      // Check if freelancer has active lead plan
      const hasLeadPlan = await storage.hasActiveLeadPlan(profile.id);
      if (!hasLeadPlan) {
        return res.status(403).json({ message: "Active lead plan required to accept leads" });
      }
      
      await storage.acceptLead(leadId, profile.id);
      
      // Get lead details to notify customer
      const lead = await storage.getLeadById(leadId);
      if (lead) {
        notifyUser(lead.customerId, {
          type: 'lead_accepted',
          leadId,
          freelancer: profile
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting lead:", error);
      res.status(500).json({ message: "Failed to accept lead" });
    }
  });

  app.post('/api/freelancer/leads/:leadId/interest', isAuthenticated, async (req: any, res) => {
    try {
      const { leadId } = req.params;
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      const interest = await storage.expressInterest({
        leadId,
        freelancerId: profile.id
      });
      
      res.json(interest);
    } catch (error) {
      console.error("Error expressing interest:", error);
      res.status(500).json({ message: "Failed to express interest" });
    }
  });

  // Customer routes
  app.get('/api/customer/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const leads = await storage.getLeadsByCustomer(userId);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching customer leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post('/api/customer/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const leadData = insertLeadSchema.parse({
        ...req.body,
        customerId: userId
      });
      
      const lead = await storage.createLead(leadData);
      
      // Notify relevant freelancers
      const freelancers = await storage.getFreelancersByCategory(leadData.categoryId, leadData.pincode);
      for (const freelancer of freelancers) {
        notifyUser(freelancer.userId, {
          type: 'new_lead',
          lead: { ...lead, category: freelancer.category }
        });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.get('/api/customer/freelancers', async (req, res) => {
    try {
      const { categoryId, area } = req.query;
      
      if (!categoryId) {
        return res.status(400).json({ message: "Category ID is required" });
      }
      
      // Get freelancers with position plans first, then regular freelancers
      const positionFreelancers = area ? 
        await storage.getPositionPlanFreelancers(categoryId as string, area as string) : [];
      const regularFreelancers = await storage.getFreelancersByCategory(categoryId as string, area as string);
      
      // Remove duplicates and maintain position order
      const freelancerMap = new Map();
      
      // Add position plan freelancers first
      positionFreelancers.forEach(f => freelancerMap.set(f.id, f));
      
      // Add regular freelancers
      regularFreelancers.forEach(f => {
        if (!freelancerMap.has(f.id)) {
          freelancerMap.set(f.id, f);
        }
      });
      
      const allFreelancers = Array.from(freelancerMap.values());
      res.json(allFreelancers);
    } catch (error) {
      console.error("Error fetching freelancers:", error);
      res.status(500).json({ message: "Failed to fetch freelancers" });
    }
  });

  // Subscription routes
  app.get('/api/freelancer/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      const subscriptions = await storage.getActiveSubscriptions(profile.id);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post('/api/freelancer/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      const subscriptionData = insertSubscriptionSchema.parse({
        ...req.body,
        freelancerId: profile.id
      });
      
      const subscription = await storage.createSubscription(subscriptionData);
      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/leads', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get('/api/admin/verifications/pending', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const pendingVerifications = await storage.getPendingVerifications();
      res.json(pendingVerifications);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  app.post('/api/admin/verifications/:freelancerId/:status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { freelancerId, status } = req.params;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      await storage.updateVerificationStatus(freelancerId, status as 'approved' | 'rejected');
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating verification status:", error);
      res.status(500).json({ message: "Failed to update verification" });
    }
  });

  return httpServer;
}
