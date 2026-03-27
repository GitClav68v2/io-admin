import { getCompanySettings } from '@/lib/settings'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const settings = await getCompanySettings()
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Company Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  )
}
