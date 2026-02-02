
import { supabase, isSupabaseConnected } from '../lib/supabase';
import { AidRequest, User } from '../types';
import { INITIAL_REQUESTS, MOCK_USER } from '../constants';
import emailjs from '@emailjs/browser';

const LS_REQUESTS_KEY = 'citi_requests';
const LS_USERS_KEY = 'citi_users';

// CONFIGURAÇÃO EMAILJS - SUBSTITUA PELOS SEUS DADOS
const EMAILJS_SERVICE_ID = 'service_xxxx'; 
const EMAILJS_TEMPLATE_ID = 'template_xxxx';
const EMAILJS_PUBLIC_KEY = 'xxxx_xxxx_xxxx';

export const api = {
  async getUsers(): Promise<User[]> {
    if (isSupabaseConnected && supabase) {
      const { data, error } = await supabase.from('users').select('content');
      if (!error && data) return data.map((row: any) => row.content) as User[];
    }
    const saved = localStorage.getItem(LS_USERS_KEY);
    return saved ? JSON.parse(saved) : [MOCK_USER];
  },

  async saveUser(user: User): Promise<void> {
    if (isSupabaseConnected && supabase) {
      await supabase.from('users').upsert({ id: user.id, content: user });
    }
    const current = await api.getUsers();
    const updated = current.find(u => u.id === user.id) ? current.map(u => u.id === user.id ? user : u) : [...current, user];
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(updated));
  },

  async getRequests(): Promise<AidRequest[]> {
    if (isSupabaseConnected && supabase) {
      const { data, error } = await supabase.from('requests').select('content');
      if (!error && data) return data.map((row: any) => row.content) as AidRequest[];
    }
    const saved = localStorage.getItem(LS_REQUESTS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  },

  async saveRequest(req: AidRequest): Promise<void> {
    if (isSupabaseConnected && supabase) {
      await supabase.from('requests').upsert({ id: req.id, content: req });
    }
    const current = await api.getRequests();
    const updated = current.find(r => r.id === req.id) ? current.map(r => r.id === req.id ? req : r) : [req, ...current];
    localStorage.setItem(LS_REQUESTS_KEY, JSON.stringify(updated));
  },

  async deleteRequest(id: string): Promise<void> {
    if (isSupabaseConnected && supabase) await supabase.from('requests').delete().eq('id', id);
    const current = await api.getRequests();
    localStorage.setItem(LS_REQUESTS_KEY, JSON.stringify(current.filter(r => r.id !== id)));
  },

  async sendEmailNotification(to: string, subject: string, body: string): Promise<void> {
    const adminEmails = ["eirasmc@gmail.com", "edson.takitani@citimedicinareprodutiva.com.br"];
    
    const sendToRecipients = async (email: string) => {
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          { to_email: email, subject: subject, message: body },
          EMAILJS_PUBLIC_KEY
        );
      } catch (err) {
        console.error("Falha ao enviar e-mail para:", email, err);
      }
    };

    // Envia para o usuário e para os administradores
    await Promise.all([to, ...adminEmails].map(email => sendToRecipients(email)));
  },

  async uploadFile(file: File): Promise<string> {
    if (!isSupabaseConnected || !supabase) return URL.createObjectURL(file);
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { data, error } = await supabase.storage.from('documentos').upload(fileName, file);
    if (error) throw new Error("Falha no upload");
    const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(fileName);
    return urlData.publicUrl;
  }
};
