import { createClient } from '@/lib/supabase/server'
import PromoManager from '@/components/PromoManager'

export default async function PromosPage() {
  const supabase = await createClient()
  const { data: promos } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Promo Codes</h1>
      <PromoManager initialPromos={promos ?? []} />
    </div>
  )
}
