import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const { user, response: authResponse } = await requireAuth()
  if (authResponse) return authResponse
  if (!checkRateLimit(`hs:${user!.id}`, 20, 60_000)) {
    return NextResponse.json([], { status: 429 })
  }
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: q,
      limit: 8,
      properties: ['firstname', 'lastname', 'company', 'email', 'phone', 'address', 'city', 'state', 'zip'],
    }),
  })

  if (!res.ok) return NextResponse.json([])

  const { results } = await res.json()
  const contacts = (results ?? []).map((c: any) => ({
    id: c.id,
    name: [c.properties.firstname, c.properties.lastname].filter(Boolean).join(' '),
    company: c.properties.company ?? '',
    email: c.properties.email ?? '',
    phone: c.properties.phone ?? '',
    address: c.properties.address ?? '',
    city: c.properties.city ?? '',
    state: c.properties.state ?? 'CA',
    zip: c.properties.zip ?? '',
  }))

  return NextResponse.json(contacts)
}
