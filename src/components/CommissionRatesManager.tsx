'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CommissionRate } from '@/lib/types'
import { Plus, X, Save, Trash2 } from 'lucide-react'

const blank = (): Partial<CommissionRate> => ({
  rep_name: '',
  user_email: '',
  rate_pct: 10,
  effective_date: new Date().toISOString().split('T')[0],
})

export default function CommissionRatesManager({ initialRates }: { initialRates: CommissionRate[] }) {
  const supabase = createClient()
  const [rates, setRates]       = useState(initialRates)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<CommissionRate | null>(null)
  const [form, setForm]         = useState<Partial<CommissionRate>>(blank())
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  function openNew() { setForm(blank()); setEditing(null); setShowForm(true) }
  function openEdit(r: CommissionRate) { setForm(r); setEditing(r); setShowForm(true) }

  async function handleSave() {
    setSaving(true)
    if (editing) {
      const { data } = await supabase
        .from('commission_rates')
        .update(form)
        .eq('id', editing.id)
        .select()
        .single()
      if (data) setRates(prev => prev.map(r => r.id === data.id ? data : r))
    } else {
      const { data } = await supabase
        .from('commission_rates')
        .insert(form)
        .select()
        .single()
      if (data) setRates(prev => [data, ...prev])
    }
    setSaving(false)
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this commission rate?')) return
    setDeleting(id)
    await supabase.from('commission_rates').delete().eq('id', id)
    setRates(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  function field(key: keyof CommissionRate, label: string, type = 'text', placeholder = '') {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <input
          type={type}
          placeholder={placeholder}
          value={(form[key] as string | number) ?? ''}
          onChange={e => setForm(f => ({
            ...f,
            [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
          }))}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Commission Rates</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus size={15} /> Add Rate
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">{editing ? 'Edit Rate' : 'New Commission Rate'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {field('rep_name', 'Rep Name', 'text', 'e.g. David')}
              {field('user_email', 'Email', 'email', 'rep@company.com')}
              {field('rate_pct', 'Commission Rate (%)', 'number', '10')}
              {field('effective_date', 'Effective Date', 'date')}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => setShowForm(false)}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Save size={14} /> {saving ? 'Saving…' : 'Save Rate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rates table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Rep Name', 'Email', 'Rate %', 'Effective Date', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rates.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-800">{r.rep_name || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{r.user_email}</td>
                <td className="px-5 py-3 text-slate-700 font-semibold">{Number(r.rate_pct).toFixed(1)}%</td>
                <td className="px-5 py-3 text-slate-500">{r.effective_date}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEdit(r)}
                      className="text-cyan-600 hover:underline text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deleting === r.id}
                      className="text-red-400 hover:text-red-600 disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rates.length && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                  No commission rates configured — default rate of 10% will be applied
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
