import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
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
Signed by: ${repName || 'the Integration One team'}

Return JSON:
{
  "subject": "concise subject line",
  "body": "email body — 3 short paragraphs, plain text"
}

Tone: friendly, professional, not pushy. Reference the proposal number. Offer to answer questions or schedule a quick site walk.
Return ONLY valid JSON — no markdown, no extra text.`,
    }],
  })

  try {
    const text = (message.content[0] as Anthropic.TextBlock).text.trim()
    const result = JSON.parse(text)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
