import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip') ?? ''
  if (!/^\d{5}$/.test(zip)) return NextResponse.json(null)
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { next: { revalidate: 86400 } })
    if (!res.ok) return NextResponse.json(null)
    const data = await res.json()
    const place = data.places?.[0]
    if (!place) return NextResponse.json(null)
    return NextResponse.json({ city: place['place name'], state: place['state abbreviation'] })
  } catch {
    return NextResponse.json(null)
  }
}
