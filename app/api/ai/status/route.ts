import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/api-auth'

const STATUS_FALLBACKS: Record<string, string> = {
  PENDING: 'Your complaint is in the queue and will be assigned soon.',
  ASSIGNED: 'Your complaint has been assigned and will be reviewed by the department.',
  IN_PROGRESS: 'Work on your complaint is in progress.',
  RESOLVED: 'The issue has been resolved. You may be asked for feedback.',
  REJECTED: 'The complaint was rejected. Please check the details or resubmit.',
  CLOSED: 'The complaint is closed.',
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

function buildFallbackMessage(complaint: {
  displayId: string
  status: string
  slaDeadline: Date | null
  departmentName: string | null
  assignedOfficerName: string | null
}) {
  const status = complaint.status.toUpperCase()
  const base = STATUS_FALLBACKS[status] || 'Your complaint is being processed.'
  const officerText = complaint.assignedOfficerName
    ? ` Assigned officer: ${complaint.assignedOfficerName}.`
    : ' Assigned officer: not assigned yet.'
  const deptText = complaint.departmentName ? ` Department: ${complaint.departmentName}.` : ''
  const slaText = complaint.slaDeadline
    ? ` SLA deadline: ${complaint.slaDeadline.toLocaleString()}.`
    : ''

  return `${complaint.displayId}: ${base}${officerText}${deptText}${slaText}`
}

export async function GET(request: NextRequest) {
  try {
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const complaintId = url.searchParams.get('complaintId')
    const displayId = url.searchParams.get('displayId')

    if (!complaintId && !displayId) {
      return NextResponse.json({ error: 'complaintId or displayId is required' }, { status: 400 })
    }

    const complaint = await prisma.complaint.findFirst({
      where: complaintId
        ? { id: complaintId }
        : { displayId: displayId?.toUpperCase() },
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        assignedOfficer: { select: { id: true, name: true } },
        timeline: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    if (payload.role === 'OFFICER') {
      if (complaint.assignedOfficerId !== payload.userId) {
        return NextResponse.json({ error: 'You do not have permission to view this complaint.' }, { status: 403 })
      }
    } else if (complaint.citizenId !== payload.userId) {
      return NextResponse.json({ error: 'You do not have permission to view this complaint.' }, { status: 403 })
    }

    const prompt = [
      'You are a civic assistant. Write a short, friendly status explanation for a complaint.',
      'Use only the provided data. Do not invent facts.',
      'Return only valid JSON with a single key: message.',
      'Keep it to 2-4 sentences. Mention officer/department if available.',
      'If no officer, say it is not assigned yet. If SLA deadline exists, mention it.',
      JSON.stringify({
        complaint: {
          displayId: complaint.displayId,
          status: complaint.status,
          priority: complaint.priority,
          category: complaint.category?.name ?? null,
          department: complaint.department?.name ?? null,
          assignedOfficer: complaint.assignedOfficer?.name ?? null,
          slaDeadline: complaint.slaDeadline?.toISOString() ?? null,
          recentTimeline: complaint.timeline.map((t) => ({
            status: t.status,
            message: t.message,
            createdAt: t.createdAt.toISOString(),
          })),
        },
      }),
    ].join('\n')

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key missing' }, { status: 500 })
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.2,
            responseMimeType: 'application/json'
          },
        }),
      }
    )

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'LLM error' }, { status: 500 })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    const json = typeof text === 'string' ? extractJson(text) : null

    const fallbackMessage = buildFallbackMessage({
      displayId: complaint.displayId,
      status: complaint.status,
      slaDeadline: complaint.slaDeadline,
      departmentName: complaint.department?.name ?? null,
      assignedOfficerName: complaint.assignedOfficer?.name ?? null,
    })

    const message = typeof json?.message === 'string' && json.message.trim().length > 0
      ? json.message.trim()
      : fallbackMessage

    const lowerMessage = message.toLowerCase()
    const officerName = complaint.assignedOfficer?.name ?? null
    const departmentName = complaint.department?.name ?? null
    const slaDeadline = complaint.slaDeadline

    let finalMessage = message
    if (officerName && !lowerMessage.includes(officerName.toLowerCase())) {
      finalMessage = `${finalMessage} Assigned officer: ${officerName}.`
    }
    if (departmentName && !lowerMessage.includes(departmentName.toLowerCase())) {
      finalMessage = `${finalMessage} Department: ${departmentName}.`
    }
    if (slaDeadline && !lowerMessage.includes('sla')) {
      finalMessage = `${finalMessage} SLA deadline: ${slaDeadline.toLocaleString()}.`
    }

    return NextResponse.json({
      complaintId: complaint.id,
      displayId: complaint.displayId,
      status: complaint.status,
      message: finalMessage,
      slaDeadline: complaint.slaDeadline?.toISOString() ?? null,
      departmentName: complaint.department?.name ?? null,
      assignedOfficerName: complaint.assignedOfficer?.name ?? null,
    })
  } catch (error) {
    console.error('GET /api/ai/status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
