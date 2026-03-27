import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { response: authResponse } = await requireAuth()
  if (authResponse) return authResponse

  const { code, grandTotal } = await req.json()

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ valid: false, reason: 'Invalid code' })
  }

  const { data: promo } = await supabase
    .from('promo_codes')
    .select('*')
    .ilike('code', code.trim())
    .single()

  if (!promo) {
    return NextResponse.json({ valid: false, reason: 'Invalid code' })
  }

  if (!promo.active) {
    return NextResponse.json({ valid: false, reason: 'Invalid code' })
  }

  if (promo.expiry_date) {
    const today = new Date().toISOString().split('T')[0]
    if (promo.expiry_date < today) {
      return NextResponse.json({ valid: false, reason: 'Expired' })
    }
  }

  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return NextResponse.json({ valid: false, reason: 'Usage limit reached' })
  }

  const discountAmount =
    promo.type === 'percentage'
      ? Math.round(grandTotal * (promo.value / 100) * 100) / 100
      : promo.value

  return NextResponse.json({
    valid: true,
    type: promo.type,
    value: promo.value,
    discountAmount,
    code: promo.code,
  })
}
