import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in.',
  )
}

// Row/Insert/Update shapes for each table live in `@/types/database` and are
// applied at each call site (via query return-type annotations), rather than
// as a client-level generic — see that file for why.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
