'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PortalCustomer } from '@/lib/types'
import { addPortalCustomer, updatePortalCustomer } from '@/app/(dashboard)/portal/actions'
import { Plus, X, Save } from 'lucide-react'

const blank = (): Partial<PortalCustomer> => ({
  business_name: '', contact_name: '', email: '', phone: '',
})

export default function PortalCustomersManager({ initialCustomers }: { initialCustomers: PortalCustomer[] }) {
  const router = useRouter()
  const [customers, setCustomers] = useState(initialCustomers)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<PortalCustomer | null>(null)
  const [form, setForm]           = useState<Partial<PortalCustomer>>(blank())
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  function openNew()  { setForm(blank()); setEditing(null); setShowForm(true); setError('') }
  function openEdit(c: PortalCustomer) { setForm(c); setEditing(c); setShowForm(true); setError('') }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      if (editing) {
        const data = await updatePortalCustomer(editing.id, form)
        setCustomers(prev => prev.map(c => c.id === data.id ? data : c))
      } else {
        const data = await addPortalCustomer(form)
        setCustomers(prev => [data, ...prev])
      }
      setShowForm(false)
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  function field(key: keyof PortalCustomer, label: string, type = 'text') {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <input type={type}
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
          <Plus size={15} /> Add Customer
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">{editing ? 'Edit Customer' : 'New Customer'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('business_name', 'Business Name *')}
                {field('contact_name', 'Contact Name')}
                {field('email', 'Email *', 'email')}
                {field('phone', 'Phone')}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Account #', 'Business', 'Contact', 'Email', 'Phone', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/portal/${c.id}`)}>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{c.account_number}</td>
                <td className="px-5 py-3 font-medium text-slate-800">{c.business_name}</td>
                <td className="px-5 py-3 text-slate-500">{c.contact_name || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{c.email}</td>
                <td className="px-5 py-3 text-slate-500">{c.phone || '—'}</td>
                <td className="px-5 py-3" onClick={e => { e.stopPropagation(); openEdit(c) }}>
                  <span className="text-cyan-600 hover:underline text-xs font-medium cursor-pointer">Edit</span>
                </td>
              </tr>
            ))}
            {!customers.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No customers yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
