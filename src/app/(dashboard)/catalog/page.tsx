import { createClient } from '@/lib/supabase/server'
import CatalogManager from '@/components/CatalogManager'

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: items } = await supabase.from('catalog_items').select('*').order('category').order('name')
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Equipment Catalog</h1>
      <p className="text-slate-500 text-sm mb-6">Pre-loaded items available when building proposals. Click any item to edit pricing.</p>
      <CatalogManager initialItems={items ?? []} />
    </div>
  )
}
