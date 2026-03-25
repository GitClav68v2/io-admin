import { createClient } from '@/lib/supabase/server'
import SuppliersManager from '@/components/SuppliersManager'

export default async function SuppliersPage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase.from('suppliers').select('*').order('company').order('name')
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">OEM Suppliers</h1>
      <SuppliersManager initialSuppliers={suppliers ?? []} />
    </div>
  )
}
