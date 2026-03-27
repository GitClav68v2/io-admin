'use client'
import { useRouter } from 'next/navigation'
import { Client } from '@/lib/types'
import { Plus } from 'lucide-react'

export default function PortalCustomersManager({ initialCustomers }: { initialCustomers: Client[] }) {
  const router = useRouter()
  const customers = initialCustomers

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => router.push('/clients')}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={15} /> Add Client
        </button>
      </div>

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
                <td className="px-5 py-3 font-medium text-slate-800">{c.company || c.name}</td>
                <td className="px-5 py-3 text-slate-500">{c.name || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{c.email || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{c.phone || '—'}</td>
                <td className="px-5 py-3" onClick={e => { e.stopPropagation(); router.push('/clients') }}>
                  <span className="text-cyan-600 hover:underline text-xs font-medium cursor-pointer">Edit</span>
                </td>
              </tr>
            ))}
            {!customers.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No portal customers yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
