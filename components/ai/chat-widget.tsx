'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { CATEGORIES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, X } from 'lucide-react'

interface ComplaintItem {
  id: string
  displayId: string
  status: string
  slaDeadline: string | null
  createdAt: string
  departmentName?: string | null
  assignedOfficerName?: string | null
}

interface DraftResponse {
  categoryId: string
  subcategoryId: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  confidence?: number
  clarifyingQuestion?: string | null
  latitude?: number
  longitude?: number
  address?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

interface StatusResponse {
  complaintId: string
  displayId: string
  status: string
  message: string
  slaDeadline: string | null
  departmentName: string | null
  assignedOfficerName: string | null
}

const STATUS_EXPLANATIONS: Record<string, string> = {
  PENDING: 'Your complaint is in the queue and will be assigned soon.',
  ASSIGNED: 'Your complaint has been assigned to the relevant department.',
  IN_PROGRESS: 'Work on your complaint is in progress.',
  RESOLVED: 'The issue has been resolved. You may be asked for feedback.',
  REJECTED: 'The complaint was rejected. Please check the details or resubmit.',
  CLOSED: 'The complaint is closed.',
}

export function ChatWidget() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I can explain complaint status or help you file a new complaint.',
    },
  ])
  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [loadingComplaints, setLoadingComplaints] = useState(false)
  const [draft, setDraft] = useState<DraftResponse | null>(null)
  const [draftMode, setDraftMode] = useState<'idle' | 'awaitingDescription' | 'awaitingClarification'>('idle')
  const [draftBaseMessage, setDraftBaseMessage] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (open) {
      scrollToBottom()
    }
  }, [messages, open])

  useEffect(() => {
    if (!open) return
    if (complaints.length > 0) return

    setLoadingComplaints(true)
    apiFetch<{ items: ComplaintItem[] }>('/api/complaints?limit=50')
      .then((data) => setComplaints(data.items))
      .catch(() => {})
      .finally(() => setLoadingComplaints(false))
  }, [open, complaints.length])

  const recentComplaints = useMemo(() => complaints.slice(0, 5), [complaints])

  const addMessage = (role: Message['role'], text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${role}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, role, text },
    ])
  }

  const resolveCategoryLabel = (categoryId: string, subcategoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId)
    const subcategory = category?.subcategories?.find((s) => s.id === subcategoryId)
    const categoryName = category?.name ?? categoryId
    const subcategoryName = subcategory?.name ?? subcategoryId
    return `${categoryName} > ${subcategoryName}`
  }

  const requestDraft = async (text: string) => {
    try {
      const data = await apiFetch<DraftResponse & { fallback?: DraftResponse }>('/api/ai/complaint-draft', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      })

      // Handle clarifying question — the LLM needs more info
      if (data.clarifyingQuestion && !data.categoryId) {
        addMessage('assistant', data.clarifyingQuestion)
        setDraft(null)
        setDraftMode('awaitingClarification')
        setDraftBaseMessage(text)
        return
      }

      // If we have a clarifying question BUT also a draft, show both
      if (data.clarifyingQuestion && data.categoryId) {
        addMessage('assistant', data.clarifyingQuestion)
      }

      setDraftMode('idle')
      setDraftBaseMessage('')
      setDraft(data)
      const categoryLabel = resolveCategoryLabel(data.categoryId, data.subcategoryId)
      addMessage(
        'assistant',
        `Suggested: ${categoryLabel}, Priority ${data.priority}.`
      )
      if (data.guidance) {
        addMessage('assistant', `💡 ${data.guidance}`)
      }
      addMessage('assistant', 'Click "Apply draft" to pre-fill the complaint form.')
    } catch (err: any) {
      setDraftMode('idle')
      setDraftBaseMessage('')
      
      const msg = err?.message?.toLowerCase() || ''
      
      if (msg.includes('quota') || msg.includes('rate limit')) {
        addMessage('assistant', '⚠️ AI service is temporarily busy. Please try again in a moment.')
        return
      }

      if (msg.includes('unauthorized') || msg.includes('401')) {
        addMessage('assistant', '🔒 Please log in to use the complaint drafting feature.')
        return
      }

      if (msg.includes('gemini') || msg.includes('api key')) {
        addMessage('assistant', '⚠️ AI service is currently unavailable. You can still file a complaint manually using the "+ New Complaint" button.')
        return
      }

      // Generic friendly fallback
      addMessage('assistant', 'Sorry, I had trouble processing that. Could you try describing the issue again? Include the type of problem and location.')
    }
  }

  const explainComplaint = async (complaint: ComplaintItem) => {
    addMessage('assistant', `Checking status for ${complaint.displayId}...`)
    try {
      const data = await apiFetch<StatusResponse>(
        `/api/ai/status?complaintId=${encodeURIComponent(complaint.id)}`
      )
      addMessage('assistant', data.message)
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('quota') || err?.message?.toLowerCase().includes('rate limit')) {
        addMessage('assistant', `⚠️ Google Gemini API limit reached: ${err.message}`)
        return
      }
      const status = complaint.status.toUpperCase()
      const base = STATUS_EXPLANATIONS[status] || 'Your complaint is being processed.'
      const slaText = complaint.slaDeadline
        ? ` SLA deadline: ${new Date(complaint.slaDeadline).toLocaleString()}.`
        : ''
      addMessage('assistant', `${complaint.displayId}: ${base}${slaText}`)
    }
  }

  const handleQuickExplain = () => {
    if (recentComplaints.length === 0 && !loadingComplaints) {
      addMessage('assistant', 'I could not find your complaints yet. Please try again.')
      return
    }
    addMessage('assistant', 'Select a complaint to explain its status:')
  }

  const handleDraft = async () => {
    const text = input.trim()
    if (!text) {
      setDraftMode('awaitingDescription')
      addMessage('assistant', 'Describe the issue and include the location or landmark if possible.')
      return
    }
    addMessage('user', text)
    setInput('')
    await requestDraft(text)
  }

  const applyDraft = () => {
    if (!draft) return
    localStorage.setItem('ai-complaint-draft', JSON.stringify(draft))
    router.push(`/citizen/complaints/new?draft=${Date.now()}`)
    setDraft(null)
  }

  const handleSubmit = async () => {
    const text = input.trim()
    if (!text) return

    addMessage('user', text)
    setInput('')

    const lower = text.toLowerCase()
    
    // 1. Handle Greetings
    const isGreeting = /^(hi|hello|hey|hii|good morning|good afternoon|greetings)/i.test(lower)
    if (isGreeting && text.length < 30) {
      setDraftMode('idle')
      addMessage('assistant', 'Hello! How can I help you today? You can ask me about policies, or I can help you draft a complaint.')
      return
    }

    // 2. Handle RAG FAQ Questions
    const isQuestion = text.includes('?') || /^(how|what|when|why|can i|is there|sla|tell me about|explain)/i.test(lower)
    if (isQuestion) {
      try {
        const faqRes = await apiFetch<{ isRelevant: boolean; answer: string }>('/api/ai/faq', {
          method: 'POST',
          body: JSON.stringify({ query: text })
        })
        
        addMessage('assistant', faqRes.answer)
        if (draftMode !== 'idle') setDraftMode('idle')
        return
      } catch (err) {
        console.error('FAQ error:', err)
      }
    }

    if (draftMode === 'idle') {
      setDraft(null)
    }

    if (draftMode === 'awaitingDescription') {
      void requestDraft(text)
      return
    }

    if (draftMode === 'awaitingClarification') {
      const combined = `${draftBaseMessage}\nClarification: ${text}`
      void requestDraft(combined)
      return
    }

    const match = text.match(/CR-\d{4}-\d{5}/i)
    if (match) {
      const displayId = match[0].toUpperCase()
      const complaint = complaints.find((c) => c.displayId === displayId)
      if (complaint) {
        void explainComplaint(complaint)
        return
      }
      try {
        const data = await apiFetch<StatusResponse>(`/api/ai/status?displayId=${encodeURIComponent(displayId)}`)
        addMessage('assistant', data.message)
      } catch (err: any) {
        addMessage('assistant', err?.message || 'I could not find that complaint yet. Try again later.')
      }
      return
    }

    const wantsStatus = /status|track|where is my complaint|check my complaint/i.test(lower)
    if (wantsStatus) {
      handleQuickExplain()
      return
    }

    const startDraftCmd = /new complaint|create.*complaint|file.*complaint|register.*complaint|raise.*complaint|lodge.*complaint|report/i.test(lower)
    if (startDraftCmd && text.length < 30) {
      setDraftMode('awaitingDescription')
      addMessage('assistant', 'Sure. Please describe the issue and include the location or landmark.')
      return
    }

    await requestDraft(text)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && (
        <Button
          className="rounded-full h-12 w-12 p-0"
          onClick={() => setOpen(true)}
          aria-label="Open assistant"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}

      {open && (
        <Card className="w-80 shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="text-sm font-semibold">CivicResolve Assistant</div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-3 py-2 border-b bg-muted/50">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={handleQuickExplain}>
                Explain status
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={handleDraft}>
                Draft complaint
              </Button>
            </div>
          </div>

          <ScrollArea className="h-64 px-3">
            <div className="space-y-2 py-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === 'assistant'
                      ? 'text-sm text-muted-foreground whitespace-pre-wrap'
                      : 'text-sm text-foreground whitespace-pre-wrap'
                  }
                >
                  {m.text}
                </div>
              ))}

              {recentComplaints.length > 0 &&
                messages[messages.length - 1]?.text.includes('Select a complaint') && (
                  <div className="space-y-1">
                    {recentComplaints.map((c) => (
                      <Button
                        key={c.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => void explainComplaint(c)}
                      >
                        {c.displayId}
                      </Button>
                    ))}
                  </div>
                )}

              {draft && (
                <div className="pt-2">
                  <Button size="sm" className="w-full" onClick={applyDraft}>
                    Apply draft
                  </Button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-2">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a complaint..."
                onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
              />
              <Button onClick={() => void handleSubmit()}>Send</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
