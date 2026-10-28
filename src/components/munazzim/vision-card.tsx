'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Pencil, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useT } from '@/lib/use-t'
import { jsonFetch } from '@/lib/api'
import type { Vision } from '@/lib/types'

// بطاقة «رؤيتي» — خانة كتابة الرؤية الشخصية بحرية كاملة
export function VisionCard() {
  const { t } = useT()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: vision, isLoading } = useQuery<Vision>({
    queryKey: ['vision'],
    queryFn: () => jsonFetch('/api/vision'),
  })

  const saveMut = useMutation({
    mutationFn: (body: string) => jsonFetch('/api/vision', { method: 'PUT', body: JSON.stringify({ body }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vision'] }),
  })

  const body = vision?.body ?? ''

  // حفظ تلقائي بعد 1.2 ثانية من توقف الكتابة
  function onChange(v: string) {
    setDraft(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveMut.mutate(v)
    }, 1200)
  }

  function startEdit() {
    setDraft(body)
    setEditing(true)
  }

  function finishEdit(save: boolean) {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (save) saveMut.mutate(draft)
    setEditing(false)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section
        className="overflow-hidden rounded-2xl border bg-white card-shadow"
        aria-label={t.myVision}
      >
        {/* رأس البطاقة بطبقة زرقاء فاتحة — هوية المقترح */}
        <div className="flex items-center justify-between gap-3 border-b border-[#dcebf3] bg-[#e9f3f8] px-5 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2582b1] text-white">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-base font-bold text-[#1d6a92]">{t.myVision}</h2>
              <p className="truncate text-[11px] text-[#4d7f9b]">{t.visionBadge}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!editing && (
              <Button size="sm" variant="ghost" onClick={startEdit} className="h-8 gap-1.5 text-[#1d6a92] hover:bg-[#d7e8f2]">
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {t.edit}
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#1d6a92] hover:bg-[#d7e8f2]" aria-label={open ? t.close : t.myVision}>
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-5 py-4">
            {isLoading ? (
              <div className="flex h-24 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              </div>
            ) : editing ? (
              <div>
                <Textarea
                  value={draft}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={t.visionPlaceholder}
                  className="min-h-36 resize-y border-[#cfe2ec] text-[15px] leading-8 focus-visible:ring-[#2582b1]"
                  aria-label={t.myVision}
                  autoFocus
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground">{t.visionHint}</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => finishEdit(false)}>
                      {t.cancel}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => finishEdit(true)}
                      disabled={saveMut.isPending}
                      className="bg-[#2582b1] text-white hover:bg-[#1d6a92]"
                    >
                      {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
                    </Button>
                  </div>
                </div>
              </div>
            ) : body.trim() ? (
              <button
                type="button"
                onClick={startEdit}
                className="block w-full cursor-text text-start"
                aria-label={t.edit}
              >
                <p className="whitespace-pre-wrap text-[15px] leading-8 text-[#33424c]">{body}</p>
              </button>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                className="block w-full rounded-xl border border-dashed border-[#b9d4e3] bg-[#f4f9fc] px-6 py-8 text-center text-sm text-[#4d7f9b] transition-colors hover:bg-[#e9f3f8]"
              >
                {t.visionEmpty}
              </button>
            )}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}
