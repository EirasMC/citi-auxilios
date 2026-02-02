import { supabase, isSupabaseConnected } from '../lib/supabase';
import { AidRequest, User } from '../types';
import { INITIAL_REQUESTS, MOCK_USER } from '../constants';

const LS_REQUESTS_KEY = 'citi_requests';
const LS_USERS_KEY = 'citi_users';

export const api = {
  // --- USERS ---
  
  async getUsers(): Promise<User[]> {
    if (isSupabaseConnected && supabase) {
      const { data, error } = await supabase.from('users').select('content');
      if (!error && data) {
        return data.map((row: any) => row.content) as User[];
      }
    }
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
    
    const current = await api.getUsers();
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
      updated = [req, ...current];
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
  },

  // --- STORAGE ---
  async uploadFile(file: File): Promise<string> {
    if (!isSupabaseConnected || !supabase) {
      console.warn("Supabase não conectado. Simulando upload local (sem persistência real de arquivo).");
      return URL.createObjectURL(file);
    }

    // Cria um nome único: timestamp_nome-do-arquivo
    // Remove caracteres especiais para evitar erros na URL
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${Date.now()}_${sanitizedName}`;
    
    // Upload para o bucket 'documentos'
    const { data, error } = await supabase.storage
      .from('documentos')
      .upload(fileName, file);

    if (error) {
      console.error("Erro no upload:", error);
      throw new Error("Falha ao fazer upload do arquivo. Verifique se o Bucket 'documentos' existe e é público.");
    }

    // Pega a URL pública
    const { data: urlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }
};