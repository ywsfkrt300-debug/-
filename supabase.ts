import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yxbfbbkdwjljvrealhib.supabase.co"; 
const supabaseAnonKey = "sb_publishable_TWmXCiU16DBbczTD3I57EQ_tu_iL8qH";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
