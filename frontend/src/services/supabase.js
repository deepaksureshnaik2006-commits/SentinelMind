import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cxfqskjibmraqfugbefc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZnFza2ppYm1yYXFmdWdiZWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwMjcwMDYsImV4cCI6MjEwOTYwMzAwNn0.xoU6OI7gj8Hx20CrOpm9KtTtRPeWOroAGhN9DyiKb-o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

