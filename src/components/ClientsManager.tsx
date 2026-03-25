'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/lib/types'
import { Plus, X, Save } from 'lucide-react'
import Link from 'next/link'

const blank = (): Partial<Client> => ({
  name: '', company: '', email: '', phone: '',
  billing_address: '', billing_city: '', billing_state: 'CA', billing_zip: '',
  site_address: '', site_city: '', site_state: 'CA', site_zip: '', notes: '',
})

export default function ClientsManager({ initialClients }: { initialClients: Client[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [clients, setClients]     = useState(initialClients)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Client | null>(null)
  const [form, setForm]           = useState<Partial<Client>>(blank())
  const [saving, setSaving]       = useState(false)

  function openNew()  { setForm(blank()); setEditing(null); setShowForm(true) }
  function openEdit(c: Client) { setForm(c); setEditing(c); setShowForm(true) }

  async function handleSave() {
    setSaving(true)
    if (editing) {
      const { data } = await supabase.from('clients').update(form).eq('id', editing.id).select().single()
      if (data) setClients(prev => prev.map(c => c.id === data.id ? data : c))
    } else {
      const { data } = await supabase.from('clients').insert(form).select().single()
      if (data) setClients(prev => [data, ...prev])
    }
    setSaving(false)
    setShowForm(false)
  }

  function field(key: keyof Client, label: string, type = 'text', placeholder = '') {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <input type={type} placeholder={placeholder}
          value={(form[key] as string) ?? ''}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">{editing ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {field('name', 'Contact Name *')}
                {field('company', 'Company / Business Name')}
                {field('email', 'Email', 'email')}
                {field('phone', 'Phone')}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Billing Address</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">{field('billing_address', 'Street')}</div>
                  {field('billing_city', 'City')}
                  <div className="grid grid-cols-2 gap-2">
                    {field('billing_state', 'State')}
                    {field('billing_zip', 'ZIP')}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Job Site Address (if different)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">{field('site_address', 'Street')}</div>
                  {field('site_city', 'City')}
                  <div className="grid grid-cols-2 gap-2">
                    {field('site_state', 'State')}
                    {field('site_zip', 'ZIP')}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea value={form.notes ?? ''} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[70px]" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Company / Name', 'Email', 'Phone', 'City', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium text-slate-800">{c.company || c.name}</div>
                  {c.company && <div className="text-xs text-slate-400">{c.name}</div>}
                </td>
                <td className="px-5 py-3 text-slate-500">{c.email || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{c.phone || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{c.billing_city || '—'}</td>
                <td className="px-5 py-3">
                  <button onClick={() => openEdit(c)} className="text-cyan-600 hover:underline text-xs font-medium">Edit</button>
                </td>
              </tr>
            ))}
            {!clients.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">No clients yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
