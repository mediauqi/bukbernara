import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR_SUPABASE_URhttps://krchvhkgjbkxaudatzon.supabase.co";
const supabaseAnonKey = "YeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyY2h2aGtnamJreGF1ZGF0em9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTIyMTQsImV4cCI6MjA4NTc4ODIxNH0.PiIRaxT83Kor-OWs0XIAmdlTeJxzXu8nEC-4G_JaePw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
