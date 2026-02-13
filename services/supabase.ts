
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DO SUPABASE ---
// Busca as chaves configuradas no painel da Vercel via import.meta.env

const envUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const envKey = import.meta.env?.VITE_SUPABASE_KEY || '';

// Função auxiliar para verificar se você configurou
export const isSupabaseConfigured = () => {
  return envUrl !== '' && envKey !== '';
};

if (!isSupabaseConfigured()) {
  console.warn("⚠️ AVISO: Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_KEY na Vercel.");
}

// Previne erro "supabaseUrl is required" usando valores placeholder se não configurado
const supabaseUrl = isSupabaseConfigured() ? envUrl : 'https://placeholder.supabase.co';
const supabaseKey = isSupabaseConfigured() ? envKey : 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);
