  import { NextRequest, NextResponse } from 'next/server'
  import { z } from 'zod'
  import { CATEGORIES } from '@/lib/constants'
  import { getAuthPayload } from '@/lib/api-auth'

  const DraftSchema = z.object({
    categoryId: z.string().min(1),
    subcategoryId: z.string().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
    description: z.string().min(20),
    confidence: z.number().min(0).max(1).optional(),
    clarifyingQuestion: z.string().nullable().optional(),
    useCurrentLocation: z.boolean().nullable().optional(),
    guidance: z.string().nullable().optional(),
  })

  function buildCategoryIndex() {
    return CATEGORIES.map((c) => ({
      id: c.id,
      subcategories: (c.subcategories || []).map((s) => s.id),
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
        'You extract complaint fields as JSON only.',
        'Return ONLY valid JSON with keys: categoryId, subcategoryId, priority, description, confidence, clarifyingQuestion, useCurrentLocation, guidance.',
        'priority must be exactly one of: LOW, MEDIUM, HIGH, CRITICAL (uppercase).',
        'Rewrite the user\'s message into a clear, professional, and detailed complaint description for the `description` field.',
        'Use only category/subcategory IDs provided. If unsure, ask a clarifyingQuestion and set confidence below 0.6.',
        'If the user asks to use their current location, GPS, or current spot, set useCurrentLocation to true. Otherwise false.',
        'If the message lacks a location or landmark (and useCurrentLocation is not true), ask a clarifyingQuestion for it.',
        'If the complaint is about a physical issue (pothole, garbage, etc.), provide a short tip in the `guidance` field reminding them to add a photo.',
        `Categories: ${JSON.stringify(categoryIndex)}`,
        `Message: ${message}`,
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

      if (!json) {
        const retryPrompt = [
          'Reformat the complaint into JSON only with keys: categoryId, subcategoryId, priority, description, confidence, clarifyingQuestion, useCurrentLocation, guidance.',
          'Rewrite the user\'s message into a clear, professional, and detailed complaint description for the `description` field.',
          'Use only category/subcategory IDs provided. If unsure, ask a clarifyingQuestion and set confidence below 0.6.',
          'priority must be exactly one of: LOW, MEDIUM, HIGH, CRITICAL (uppercase).',
          'If the user asks to use their current location, GPS, or current spot, set useCurrentLocation to true. Otherwise false.',
          'If the complaint is about a physical issue (pothole, garbage, etc.), provide a short tip in the `guidance` field reminding them to add a photo.',
          `Categories: ${JSON.stringify(categoryIndex)}`,
          `Message: ${message}`,
        ].join('\n')

        const retry = await callGemini(apiKey, retryPrompt)
        if (!retry.ok) {
          return NextResponse.json({ error: retry.error }, { status: 500 })
        }

        json = retry.text ? extractJson(retry.text) : null
      }

      if (!json) {
        return NextResponse.json({
          error: 'Failed to parse LLM response',
          fallback: {
            categoryId: 'other',
            subcategoryId: 'other-issue',
            priority: 'MEDIUM',
            description: message,
            confidence: 0.2,
            clarifyingQuestion: 'Please share the exact location/landmark and any extra details (time, severity).',
            useCurrentLocation: false,
          },
        }, { status: 200 })
      }
      if (typeof json.priority === 'string') {
        json.priority = json.priority.toUpperCase()
      }

      const parsed = DraftSchema.safeParse(json)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid draft response', details: parsed.error.flatten() }, { status: 500 })
      }

      return NextResponse.json(parsed.data)
    } catch (error) {
      console.error('POST /api/ai/complaint-draft error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
