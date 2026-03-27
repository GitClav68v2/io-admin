import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getCompanySettings() {
  const { data } = await supabase.from('company_settings').select('*').single()
  return data ?? { address: '', phone: '(949) 233-1833', license_number: '', teams_link: '', logo_url: '' }
}
