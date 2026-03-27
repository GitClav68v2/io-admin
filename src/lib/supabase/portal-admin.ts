import { createClient } from '@supabase/supabase-js'

// Uses the main io-admin Supabase project with service-role key.
// Server-side only — never expose this key to the browser.
export function createPortalAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
