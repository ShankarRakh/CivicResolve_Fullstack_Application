import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const geminiApiKey = process.env.GEMINI_API_KEY!

if (!geminiApiKey) {
  console.error('Missing Gemini API Key.')
  process.exit(1)
}

const prisma = new PrismaClient()

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-2',
      content: {
        parts: [{ text }]
      },
      outputDimensionality: 768
    })
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(`Gemini API Error: ${JSON.stringify(errorData)}`)
  }

  const data = await res.json()
  return data.embedding.values
}

// Very basic chunking by double newlines (paragraphs/sections)
function chunkText(text: string, maxChunkLength: number = 1000): string[] {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0)
  const chunks: string[] = []
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = ''
    }
    currentChunk += paragraph + '\n\n'
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

async function main() {
  console.log('Starting document ingestion...')
  
  // 1. Clear existing chunks to avoid duplicates
  console.log('Clearing old chunks from database...')
  try {
    await prisma.$executeRaw`TRUNCATE TABLE document_chunks RESTART IDENTITY;`
  } catch (e: any) {
    console.error('Error clearing chunks (table might be empty or missing):', e.message)
  }

  const docsDir = path.resolve(process.cwd(), 'docs/ai')
  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'))

  for (const file of files) {
    console.log(`\nProcessing file: ${file}`)
    const filePath = path.join(docsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // 2. Chunk the document
    const chunks = chunkText(content)
    console.log(`Split into ${chunks.length} chunks.`)

    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i]
      console.log(`  Embedding chunk ${i + 1}/${chunks.length}...`)
      
      try {
        // 3. Generate embedding
        const embedding = await generateEmbedding(chunkContent)
        
        // 4. Store via Raw SQL to support pgvector array format
        // pgvector expects a string like '[0.1, 0.2, 0.3]'
        const vectorStr = `[${embedding.join(',')}]`
        const metadataStr = JSON.stringify({ source: file, chunkIndex: i })

        await prisma.$executeRaw`
          INSERT INTO document_chunks (content, metadata, embedding)
          VALUES (${chunkContent}, ${metadataStr}::jsonb, ${vectorStr}::vector);
        `

        console.log(`  ✓ Successfully stored chunk ${i + 1}`)
      } catch (err: any) {
        console.error(`  Failed to process chunk ${i + 1}:`, err.message)
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  console.log('\nIngestion complete!')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
})
