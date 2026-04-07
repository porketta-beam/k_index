import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Server-side only -- do NOT import in client components
// Uses service role key for server-side inserts (bypasses RLS)
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);
