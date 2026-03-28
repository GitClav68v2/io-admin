import { createClient } from '@/lib/supabase/server'
import ProspectsManager from '@/components/ProspectsManager'

export default async function ProspectsPage() {
  const supabase = await createClient()
  const { data: prospects } = await supabase
    .from('prospects')
    .select('*')
    .order('created_at', { ascending: false })
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Prospects</h1>
      <ProspectsManager initialProspects={prospects ?? []} />
    </div>
  )
}
