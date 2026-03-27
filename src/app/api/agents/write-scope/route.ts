import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { user, response: authResponse } = await requireAuth()
  if (authResponse) return authResponse
  if (!checkRateLimit(`ai:${user!.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
    }
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const { brief, clientName, siteAddress } = await req.json()

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are writing a professional security camera installation proposal for Integration One, a California-based commercial security integrator.

Client: ${clientName || 'the client'}
Site: ${siteAddress || 'the job site'}
Project brief: "${brief}"

Write three sections. Return as JSON with exactly these keys:
{
  "scope": "2–3 sentence scope narrative describing what will be installed and what areas will be covered. Reference the client name and site.",
  "assumptions": "bullet list of 4–5 site/installation assumptions, each starting with •",
  "exclusions": "bullet list of 4–6 items explicitly not included, each starting with •"
}

Standard exclusions to include where relevant: permit fees (if required) billed at cost, high-voltage electrical work, underground conduit trenching, painting/patching after cable routing, internet service or router upgrades, monitoring subscription fees billed directly by provider.

Tone: professional, clear, contractor-standard. Return ONLY valid JSON — no markdown, no extra text.`,
      }],
    })

    const text = (message.content[0] as Anthropic.TextBlock).text.trim()
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    try {
      const result = JSON.parse(clean)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
  }
}
