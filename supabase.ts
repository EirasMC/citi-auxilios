import { createClient } from '@supabase/supabase-js';

// --- INSTRUÇÕES PARA O DESENVOLVEDOR ---
// Para conectar este app a um banco de dados real (para que todos vejam os mesmos dados):
// 1. Crie uma conta em https://supabase.com e um novo projeto.
// 2. No painel do Supabase, vá em SQL Editor e rode este comando para criar as tabelas:
/*
   create table users (
     id text primary key,
     content jsonb
   );
   
   create table requests (
     id text primary key,
     content jsonb
   );
*/
// 3. Pegue a URL e a KEY (anon/public) em Project Settings > API.
// 4. Configure as Variáveis de Ambiente no seu serviço de hospedagem (Netlify/Vercel):
//    VITE_SUPABASE_URL
//    VITE_SUPABASE_ANON_KEY

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConnected = !!supabase;