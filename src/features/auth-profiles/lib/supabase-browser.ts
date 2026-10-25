// Auth and map queries must share one session client and its auth-state lock.
export { getSupabaseBrowserClient } from "@/lib/supabase-browser";
