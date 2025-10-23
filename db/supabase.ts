import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export default supabase;
