// API service for communicating with Netlify Functions
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://myprojectfreelanace.netlify.app/.netlify/functions'
  : 'http://localhost:8888/.netlify/functions';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'freelancer' | 'admin';
  phone?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  customer_id: string;
  budget?: number;
  created_at: string;
}

export const api = {
  // User endpoints
  async createUser(userData: Omit<User, 'id' | 'created_at'>) {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }
    
    return response.json();
  },

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/users`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    
    return response.json();
  },

  async getUser(userId: string): Promise<User | null> {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Lead endpoints
  async createLead(leadData: Omit<Lead, 'id' | 'created_at'>) {
    const response = await fetch(`${API_BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create lead: ${response.statusText}`);
    }
    
    return response.json();
  },

  async getLeads(): Promise<Lead[]> {
    const response = await fetch(`${API_BASE_URL}/api/leads`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leads: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
};

export default api;
