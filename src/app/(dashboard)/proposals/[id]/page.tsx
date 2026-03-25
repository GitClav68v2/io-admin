import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProposalDetail from '@/components/ProposalDetail'

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*, client:clients(*), line_items:proposal_line_items(*)')
    .eq('id', id)
    .single()

  if (!proposal) notFound()

  const { data: catalog } = await supabase
    .from('catalog_items').select('*').eq('active', true).order('category').order('name')

  const { data: clients } = await supabase.from('clients').select('*').order('company')

  return <ProposalDetail proposal={proposal} catalog={catalog ?? []} clients={clients ?? []} />
}
