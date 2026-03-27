'use client'
import { useState } from 'react'
import { CompanySettings } from '@/lib/types'
import { Save } from 'lucide-react'

export default function SettingsForm({ settings }: { settings: CompanySettings }) {
  const [form, setForm] = useState({
    address:        settings.address        ?? '',
    phone:          settings.phone          ?? '',
    license_number: settings.license_number ?? '',
    teams_link:     settings.teams_link     ?? '',
  })
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [error,  setError]    = useState<string | null>(null)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    const res = await fetch('/api/settings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed') } else { setSaved(true) }
  }

  function field(key: keyof typeof form, label: string, type = 'text', placeholder = '') {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <input
          type={type}
          placeholder={placeholder}
          value={form[key]}
          onChange={set(key)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-2xl">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="font-semibold text-slate-900">Company Information</h2>
        <p className="text-xs text-slate-400 mt-0.5">Used on proposals, invoices, and outbound emails.</p>
      </div>
      <div className="p-6 space-y-4">
        {field('phone',          'Phone Number',   'text',  '(949) 233-1833')}
        {field('address',        'Address',        'text',  '123 Main St, Irvine, CA 92618')}
        {field('license_number', 'CA License #',   'text',  '987654')}
        {field('teams_link',     'Teams Meeting Link', 'url', 'https://teams.microsoft.com/…')}
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
        {error && <p className="text-sm text-red-600 mr-auto">{error}</p>}
        {saved && <p className="text-sm text-green-600 mr-auto">Saved.</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
