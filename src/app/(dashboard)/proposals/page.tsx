import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ProposalsTable from '@/components/ProposalsTable'

export default async function ProposalsPage() {
  const supabase = await createClient()
  const { data: proposals } = await supabase
    .from('proposals')
    .select('*, client:clients(name, company)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Proposals</h1>
        <Link href="/proposals/new"
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={16} /> New Proposal
        </Link>
      </div>

      <ProposalsTable proposals={proposals ?? []} />
    </div>
  )
}
