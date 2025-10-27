import { createClient } from '@supabase/supabase-js';

// The Supabase URL and public anonymous key are safe to be exposed in a client-side application.
// Row Level Security (RLS) is enabled in the Supabase database to protect data.
const supabaseUrl = 'https://hxgasuppbciqlytlebty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4Z2FzdXBwYmNpcWx5dGxlYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzAxMDEsImV4cCI6MjA3Njc0NjEwMX0.DgshVlOcV4Jzj6jC9KIhTkuOdZg84ShzaijpgIyUETk';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anonymous key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
