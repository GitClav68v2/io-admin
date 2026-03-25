import { createClient } from '@/lib/supabase/server'
import ProposalForm from '@/components/ProposalForm'

export default async function NewProposalPage() {
  const supabase = await createClient()
  const [{ data: clients }, { data: catalog }] = await Promise.all([
    supabase.from('clients').select('*').order('company'),
    supabase.from('catalog_items').select('*').eq('active', true).order('category').order('name'),
  ])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Proposal</h1>
      <ProposalForm clients={clients ?? []} catalog={catalog ?? []} />
    </div>
  )
}
