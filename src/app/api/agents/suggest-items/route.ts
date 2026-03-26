import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { description, catalog } = await req.json()

  const catalogLines = (catalog ?? []).map((item: any) =>
    `  [${item.category}] ${item.name} | SKU: ${item.sku || '—'} | $${item.unit_price}/${item.unit_label} | taxable: ${item.taxable}`
  ).join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a proposal assistant for Integration One, a commercial security camera installation company in California.

Available catalog items:
${catalogLines}

Job description from the sales rep:
"${description}"

Return a JSON array of suggested line items for this job. Use catalog items when they fit; add custom items only when needed.
Include installation labor appropriate for the scope.

Each item must match this exact shape:
{
  "section": "cameras" | "network" | "hardware" | "labor" | "other",
  "name": string,
  "description": string,
  "sku": string,
  "qty": number,
  "unit_label": "ea" | "hr" | "run" | "lot",
  "unit_price": number,
  "taxable": boolean
}

Be realistic. Return ONLY a valid JSON array — no markdown, no explanation.`,
    }],
  })

  try {
    const text = (message.content[0] as Anthropic.TextBlock).text.trim()
    const items = JSON.parse(text)
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
