
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cxwwtlxqmhgxozcgazvk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4d3d0bHhxbWhneG96Y2dhenZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NzEzNjEsImV4cCI6MjA1NzM0NzM2MX0.86rCxvb26A7UrPUd0xx3GjQ5U7nlprkJ-Pf97erQcE8";

// This is a workaround for TypeScript errors when accessing custom tables
const customSupabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export const customClient = {
  // Use any type for now to bypass TypeScript's strict checking
  // This allows us to work with tables not defined in the TypeScript definitions
  from: (table: string) => customSupabase.from(table) as any,
  rpc: (fn: string, params: any) => customSupabase.rpc(fn, params) as any,
  auth: customSupabase.auth
};
