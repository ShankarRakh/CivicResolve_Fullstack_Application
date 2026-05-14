import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 1. Helper to generate embeddings for user query
async function generateQueryEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-2',
      content: { parts: [{ text }] },
      outputDimensionality: 768
    })
  })

  if (!res.ok) throw new Error('Failed to embed query')
  const data = await res.json()
  return data.embedding.values
}

// 2. Helper to get answer from Gemini Flash
async function answerWithRAG(query: string, context: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  
  const systemInstruction = `You are the CivicResolve AI Assistant. Answer the user's question accurately using ONLY the provided CONTEXT. 
If the answer is not contained in the CONTEXT, politely reply: "I'm sorry, but I don't have that information right now."
Keep your answer concise, professional, and easy to read. Do not use outside knowledge.
Do NOT use markdown formatting (like asterisks or bolding) in your response. Just use clean plain text and newlines for spacing.`

  const prompt = `CONTEXT:\n${context}\n\nUSER QUESTION:\n${query}`

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { temperature: 0.1 } // Low temperature for high factual accuracy
    })
  })

  if (!res.ok) throw new Error('Failed to generate answer')
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer generated.'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // 1. Embed the user's query
    const queryEmbedding = await generateQueryEmbedding(query)
    const vectorStr = `[${queryEmbedding.join(',')}]`

    // 2. Search Supabase for similar chunks
    // match_threshold: 0.65 is usually a good baseline for cosine similarity
    const matches = await prisma.$queryRawUnsafe<
      Array<{ id: bigint; content: string; similarity: number }>
    >(
      `SELECT id, content, similarity FROM match_document_chunks($1::vector, 0.65, 3)`,
      vectorStr
    )

    // 3. If no highly relevant chunks are found
    if (!matches || matches.length === 0) {
      return NextResponse.json({ 
        isRelevant: false, 
        answer: "I couldn't find any relevant policy or FAQ information for that question. Can I help you with a complaint instead?"
      })
    }

    // 4. Combine the retrieved chunks into a single context string
    const contextStr = matches.map(m => m.content).join('\n\n---\n\n')

    // 5. Generate the final answer using the LLM + Context
    const finalAnswer = await answerWithRAG(query, contextStr)

    return NextResponse.json({
      isRelevant: true,
      answer: finalAnswer,
    })

  } catch (error: any) {
    console.error('FAQ API Error:', error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}
