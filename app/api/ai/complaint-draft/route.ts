import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CATEGORIES } from '@/lib/constants'
import { getAuthPayload } from '@/lib/api-auth'

// Relaxed schema — the LLM sometimes returns short descriptions or nulls
const DraftSchema = z.object({
  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().min(1), // Relaxed: accept any non-empty string
  confidence: z.number().min(0).max(1).optional(),
  clarifyingQuestion: z.string().nullable().optional(),
  useCurrentLocation: z.boolean().nullable().optional(),
  guidance: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
})

function buildCategoryIndex() {
  return CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    subcategories: (c.subcategories || []).map((s) => ({ id: s.id, name: s.name })),
  }))
}

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

async function callGemini(apiKey: string, prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  const data = await res.json()
  if (!res.ok) {
    return { ok: false, error: data.error?.message || 'LLM error', text: '' }
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  return { ok: true, error: '', text: typeof text === 'string' ? text : '' }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — allow bypass for now (development)
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const categoryIndex = buildCategoryIndex()

    const prompt = [
      'You are a civic complaint assistant. Extract structured complaint data from the user message.',
      'Return ONLY valid JSON (no markdown, no extra text).',
      '',
      'REQUIRED keys in your JSON response:',
      '  categoryId: string (from the categories list below)',
      '  subcategoryId: string (from the subcategories list below)',
      '  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"',
      '  description: string (rewrite the user message into a clear, professional, detailed complaint description, minimum 20 characters)',
      '',
      'OPTIONAL keys:',
      '  confidence: number between 0 and 1',
      '  clarifyingQuestion: string or null (ask only if you cannot determine the category/subcategory, or if no location is given)',
      '  useCurrentLocation: boolean (true only if user explicitly says "current location", "GPS", "my location")',
      '  guidance: string or null (short tip, e.g. "Consider adding a photo for faster resolution")',
      '  latitude: number or null',
      '  longitude: number or null',
      '  address: string or null (if user mentions a landmark or place name)',
      '',
      'IMPORTANT RULES:',
      '- Use ONLY the category/subcategory IDs from the list below. Never invent new ones.',
      '- If the user message is vague or missing location, still return a valid draft with your best guess for category, AND set clarifyingQuestion to ask for the missing info.',
      '- The description field must ALWAYS be at least 20 characters. Expand the user message into a proper complaint description.',
      '- If user mentions a physical issue (pothole, garbage, broken light), set guidance to remind them to add a photo.',
      '- If user says "current location" or "my location", set useCurrentLocation to true.',
      '',
      `Available categories and subcategories:`,
      JSON.stringify(categoryIndex, null, 2),
      '',
      `User message: "${message}"`,
    ].join('\n')

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key missing' }, { status: 500 })
    }

    const first = await callGemini(apiKey, prompt)
    if (!first.ok) {
      return NextResponse.json({ error: first.error }, { status: 500 })
    }

    let json = first.text ? extractJson(first.text) : null

    // Retry once if first attempt failed to produce valid JSON
    if (!json) {
      const retryPrompt = [
        'The previous attempt failed. Return ONLY a valid JSON object.',
        'Required keys: categoryId, subcategoryId, priority, description.',
        'Optional keys: confidence, clarifyingQuestion, useCurrentLocation, guidance, latitude, longitude, address.',
        `Available categories: ${JSON.stringify(categoryIndex)}`,
        `User message: "${message}"`,
      ].join('\n')

      const retry = await callGemini(apiKey, retryPrompt)
      if (!retry.ok) {
        return NextResponse.json({ error: retry.error }, { status: 500 })
      }

      json = retry.text ? extractJson(retry.text) : null
    }

    // Fallback if JSON still can't be parsed
    if (!json) {
      return NextResponse.json({
        categoryId: 'other',
        subcategoryId: 'other-issue',
        priority: 'MEDIUM',
        description: message,
        confidence: 0.2,
        clarifyingQuestion: 'I had trouble processing your request. Could you describe the issue again with the location/landmark?',
        useCurrentLocation: false,
      })
    }

    // Normalize fields before Zod validation
    if (typeof json.priority === 'string') {
      json.priority = json.priority.toUpperCase()
    }

    // Ensure description meets minimum length
    if (!json.description || json.description.length < 20) {
      json.description = message.length >= 20
        ? message
        : `${message}. Additional details needed for a complete complaint report.`
    }

    // Coerce null lat/lng to undefined (Zod handles nullable but not always from LLM)
    if (json.latitude === null) delete json.latitude
    if (json.longitude === null) delete json.longitude

    const parsed = DraftSchema.safeParse(json)
    if (!parsed.success) {
      console.error('Draft Zod validation failed:', JSON.stringify(parsed.error.flatten()))
      console.error('LLM returned:', JSON.stringify(json))

      // Instead of failing, return a usable fallback with the LLM's best effort
      return NextResponse.json({
        categoryId: json.categoryId || 'other',
        subcategoryId: json.subcategoryId || 'other-issue',
        priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(json.priority) ? json.priority : 'MEDIUM',
        description: json.description || message,
        confidence: 0.3,
        clarifyingQuestion: json.clarifyingQuestion || null,
        useCurrentLocation: json.useCurrentLocation || false,
        guidance: json.guidance || null,
      })
    }

    return NextResponse.json(parsed.data)
  } catch (error) {
    console.error('POST /api/ai/complaint-draft error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
