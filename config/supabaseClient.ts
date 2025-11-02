
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // turns off automatic refresh and localStorage persistence, prevent clash with backend
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false, // disables redirect-based detection
  },
})