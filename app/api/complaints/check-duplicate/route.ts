import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, wardId } = body;

    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Description is required and must be a string' }, { status: 400 });
    }

    // Generate embedding for the new complaint description
    // We pass `true` because this is a query to retrieve similar documents
    const queryEmbedding = await generateEmbedding(description, true);

    // Call the Postgres RPC function using Prisma raw query to avoid permission issues
    const formatEmbedding = `[${queryEmbedding.join(',')}]`;
    const threshold = 0.80;
    const matchCount = 3;
    
    // We pass the string representation of the vector and cast it
    const matchedComplaints = await prisma.$queryRaw`
      SELECT * FROM match_complaints(
        ${formatEmbedding}::vector,
        ${threshold}::float,
        ${matchCount}::int,
        ${wardId || null}::text
      )
    `;

    return NextResponse.json({ matches: matchedComplaints || [] });
  } catch (error) {
    console.error('Check duplicate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
