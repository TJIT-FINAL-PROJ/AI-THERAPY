import { createClient } from "@supabase/supabase-js";

// ✅ Use your actual Supabase URL + anon key
const supabaseUrl = "https://rpppuuziokynouthxzta.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcHB1dXppb2t5bm91dGh4enRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzIwOTIsImV4cCI6MjA3MTQ0ODA5Mn0.FiaNJIlnTPbqPi6atTO7luH3J386QouTSXc0S6Ku12k";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
