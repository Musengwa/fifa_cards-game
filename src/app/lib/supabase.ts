import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

console.log('Initializing Supabase client:', {
  url: supabaseUrl,
  hasAnonKey: !!publicAnonKey,
  anonKeyLength: publicAnonKey?.length
});

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-44e0fa0c`;

export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : `Bearer ${publicAnonKey}`,
  };
};
