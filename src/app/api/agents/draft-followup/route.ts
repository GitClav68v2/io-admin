import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  if (!checkRateLimit(`ai:${user!.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
    }
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const { proposalNumber, clientName, title, total, sentDate, repName } = await req.json()

    const fmt = (n: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
    const daysSince = sentDate
      ? Math.floor((Date.now() - new Date(sentDate).getTime()) / 86_400_000)
      : 5

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Write a brief, warm follow-up email for an unanswered security camera installation proposal.

Proposal: ${proposalNumber} — ${title}
Client: ${clientName || 'the client'}
Total: ${fmt(total)}
Sent: ${daysSince} day${daysSince !== 1 ? 's' : ''} ago
Signed by: ${repName || 'the IntegrationOne team'}

Return JSON:
{
  "subject": "concise subject line",
  "body": "email body — 3 short paragraphs, plain text"
}

Tone: friendly, professional, not pushy. Reference the proposal number. Offer to answer questions or schedule a quick site walk.
Return ONLY valid JSON — no markdown, no extra text.`,
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unknown error' }, { status: 500 })
  }
}
