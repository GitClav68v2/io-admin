import { createClient } from '@supabase/supabase-js'

// Service-role client for the customer portal Supabase project.
// Server-side only — never expose this key to the browser.
export function createPortalAdmin() {
  return createClient(
    process.env.PORTAL_SUPABASE_URL!,
    process.env.PORTAL_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
