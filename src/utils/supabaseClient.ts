import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://blqryjhjwtygafjwxbup.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJscXJ5amhqd3R5Z2Fmand4YnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjAxMTEsImV4cCI6MjA4NDczNjExMX0.k6PtzF9OE3wIQ8CxM0IPwAkZag3Iz5ed72bKS3-ttv8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);