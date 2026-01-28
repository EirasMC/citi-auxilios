import { supabase, isSupabaseConnected } from '../lib/supabase';
import { AidRequest, User } from '../types';
import { INITIAL_REQUESTS, MOCK_USER } from '../constants';

// Keys for LocalStorage fallback
const LS_REQUESTS_KEY = 'citi_requests';
const LS_USERS_KEY = 'citi_users';

export const api = {
  // --- USERS ---
  
  async getUsers(): Promise<User[]> {
    if (isSupabaseConnected && supabase) {
      const { data, error } = await supabase.from('users').select('content');
      if (!error && data) {
        // Map jsonb content back to User objects
        return data.map((row: any) => row.content) as User[];
      }
    }
    // Fallback LocalStorage
    const saved = localStorage.getItem(LS_USERS_KEY);
    return saved ? JSON.parse(saved) : [MOCK_USER];
  },

  async saveUser(user: User): Promise<void> {
    if (isSupabaseConnected && supabase) {
      const { error } = await supabase.from('users').upsert({ 
        id: user.id, 
        content: user 
      });
      if (error) console.error("Error saving user to DB:", error);
    }
    
    // Always sync to LocalStorage as cache/backup or primary
    const current = await api.getUsers();
    // Check if exists locally to avoid duplicates if mixing modes
    const exists = current.find(u => u.id === user.id);
    let updated = current;
    if (exists) {
      updated = current.map(u => u.id === user.id ? user : u);
    } else {
      updated = [...current, user];
    }
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(updated));
  },

  async updateUser(user: User): Promise<void> {
    return api.saveUser(user);
  },

  // --- REQUESTS ---

  async getRequests(): Promise<AidRequest[]> {
    if (isSupabaseConnected && supabase) {
      const { data, error } = await supabase.from('requests').select('content');
      if (!error && data) {
        return data.map((row: any) => row.content) as AidRequest[];
      }
    }
    // Fallback
    const saved = localStorage.getItem(LS_REQUESTS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  },

  async saveRequest(req: AidRequest): Promise<void> {
    if (isSupabaseConnected && supabase) {
      const { error } = await supabase.from('requests').upsert({
        id: req.id,
        content: req
      });
      if (error) console.error("Error saving request to DB:", error);
    }

    const current = await api.getRequests();
    const exists = current.find(r => r.id === req.id);
    let updated = current;
    if (exists) {
      updated = current.map(r => r.id === req.id ? req : r);
    } else {
      updated = [req, ...current]; // Prepend for new
    }
    localStorage.setItem(LS_REQUESTS_KEY, JSON.stringify(updated));
  },

  async deleteRequest(id: string): Promise<void> {
    if (isSupabaseConnected && supabase) {
      await supabase.from('requests').delete().eq('id', id);
    }

    const current = await api.getRequests();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(LS_REQUESTS_KEY, JSON.stringify(updated));
  }
};