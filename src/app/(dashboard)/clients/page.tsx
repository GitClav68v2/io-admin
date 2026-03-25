import { createClient } from '@/lib/supabase/server'
import ClientsManager from '@/components/ClientsManager'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase.from('clients').select('*').order('company').order('name')
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Clients</h1>
      <ClientsManager initialClients={clients ?? []} />
    </div>
  )
}
