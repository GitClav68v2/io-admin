import { getCompanySettings } from '@/lib/settings'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/SettingsForm'
import EmailTemplatesEditor from '@/components/EmailTemplatesEditor'

export default async function SettingsPage() {
  const supabase = await createClient()
  const [settings, { data: templates }] = await Promise.all([
    getCompanySettings(),
    supabase.from('email_templates').select('*').order('type'),
  ])
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      <SettingsForm settings={settings} />
      <EmailTemplatesEditor templates={templates ?? []} />
    </div>
  )
}
